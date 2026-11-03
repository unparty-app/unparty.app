import { after, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { approveSubmission } from '@/lib/waitlist'
import { verifySlackRequest } from '@/lib/slack-verify'

/**
 * POST /api/slack/interactions — the Approve / Reject buttons on the waitlist
 * message that /api/problem/send posts to SLACK_WEBHOOK_URL (#728).
 *
 * Slack signs every click with the app's Signing Secret (SLACK_SIGNING_SECRET)
 * and expects an answer within 3 seconds, so this route checks the signature,
 * answers 200 at once, and does the work in after(): approving goes through
 * approveSubmission() like /admin/submissions does, then the original message
 * is rewritten through response_url to say who decided, without the buttons.
 *
 * Anyone who can see the channel can click, so post it to a private channel.
 */

type SlackBlock = { type: string; [key: string]: unknown }

interface BlockActionsPayload {
  type: string
  user?: { id?: string; username?: string; name?: string }
  actions?: { action_id?: string; value?: string }[]
  response_url?: string
  message?: { text?: string; blocks?: SlackBlock[] }
}

const APPROVE = 'approve_submission'
const REJECT = 'reject_submission'
// A build told to unparty.app (#589, /api/builds): list it on /builds, or don't
const APPROVE_BUILD = 'approve_build'
const REJECT_BUILD = 'reject_build'
const SLACK_RESPONSE_URL = /^https:\/\/hooks\.slack\.com\/actions\/([A-Za-z0-9]+(?:\/[A-Za-z0-9]+)*)$/

export async function POST(request: Request) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  if (!signingSecret) {
    return NextResponse.json({ error: 'Slack buttons are not configured (SLACK_SIGNING_SECRET)' }, { status: 503 })
  }

  const rawBody = await request.text()
  const valid = verifySlackRequest(
    rawBody,
    request.headers.get('x-slack-request-timestamp'),
    request.headers.get('x-slack-signature'),
    signingSecret
  )
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: BlockActionsPayload
  try {
    payload = JSON.parse(new URLSearchParams(rawBody).get('payload') ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const action = payload.actions?.[0]
  if (payload.type === 'block_actions' && action?.value && (action.action_id === APPROVE_BUILD || action.action_id === REJECT_BUILD)) {
    const buildId = action.value
    const listed = action.action_id === APPROVE_BUILD
    const who = payload.user?.id ? `<@${payload.user.id}>` : (payload.user?.username ?? 'someone')
    after(async () => {
      const line = await decideBuild(buildId, listed, who)
      if (payload.response_url) await updateMessage(payload.response_url, payload.message, line)
    })
    return new NextResponse(null, { status: 200 })
  }
  if (payload.type !== 'block_actions' || !action?.value || (action.action_id !== APPROVE && action.action_id !== REJECT)) {
    // Something we don't handle; acknowledge so Slack doesn't show an error
    return new NextResponse(null, { status: 200 })
  }

  const submissionId = action.value
  const decision = action.action_id === APPROVE ? 'approve' : 'reject'
  const who = payload.user?.id ? `<@${payload.user.id}>` : (payload.user?.username ?? 'someone')

  after(async () => {
    const outcome = await decide(submissionId, decision)
    if (payload.response_url) {
      await updateMessage(payload.response_url, payload.message, outcomeLine(outcome, who))
    }
  })

  return new NextResponse(null, { status: 200 })
}

// A build's status from its Slack buttons; /builds shows it once listed
async function decideBuild(buildId: string, listed: boolean, who: string): Promise<string> {
  try {
    const build = await prisma.build.update({ where: { id: buildId }, data: { status: listed ? 'APPROVED' : 'REJECTED' } })
    revalidatePath('/builds')
    return listed ? `✅ build #${build.number} listed on /builds by ${who}.` : `❌ build #${build.number} not listed, by ${who}. It still counts.`
  } catch {
    return 'This build no longer exists (taken off by its owner).'
  }
}

type Outcome =
  | { kind: 'approved' | 'rejected' }
  | { kind: 'already'; status: string }
  | { kind: 'not_found' }
  | { kind: 'failed' }
  | { kind: 'locked_out' }

async function decide(submissionId: string, decision: 'approve' | 'reject'): Promise<Outcome> {
  try {
    const current = await prisma.userSubmission.findUnique({
      where: { id: submissionId },
      select: { status: true, discussionId: true },
    })
    if (!current) return { kind: 'not_found' }
    // Only a waiting worksheet can be decided here, so a stale message can't
    // undo a decision made somewhere else
    if (current.status !== 'PENDING') return { kind: 'already', status: current.status }

    if (decision === 'reject') {
      await prisma.userSubmission.update({
        where: { id: submissionId },
        data: { status: 'REJECTED', processedAt: new Date() },
      })
      return { kind: 'rejected' }
    }

    const result = await approveSubmission(submissionId, 'slack')
    if (result.outcome === 'not_found') return { kind: 'not_found' }
    if (result.outcome === 'already_approved') return { kind: 'already', status: 'APPROVED' }
    // Recorded, but Clerk didn't take the label that opens /party (#752)
    const approvedOutcome: Outcome = result.labelSet ? { kind: 'approved' } : { kind: 'locked_out' }

    // Keep GitHub in step when the site also reviews in Discussions (optional)
    if (current.discussionId && process.env.WAITLIST_REPO_OWNER && process.env.WAITLIST_REPO_NAME) {
      try {
        const { getCategoryId, updateDiscussionCategory } = await import('@/lib/github')
        await updateDiscussionCategory(current.discussionId, await getCategoryId('Approve'))
      } catch (githubError) {
        console.error('Failed to move the GitHub Discussion to Approve (non-fatal):', githubError)
      }
    }
    return approvedOutcome
  } catch (error) {
    console.error(`Slack ${decision} failed for submission ${submissionId}:`, error)
    return { kind: 'failed' }
  }
}

function outcomeLine(outcome: Outcome, who: string): string {
  switch (outcome.kind) {
    case 'approved': return `✅ Approved by ${who}. They can open /party from their next sign-in.`
    case 'rejected': return `❌ Rejected by ${who}.`
    case 'already': return `This worksheet was already ${outcome.status.toLowerCase()}; nothing changed.`
    case 'not_found': return 'This worksheet no longer exists.'
    case 'locked_out': return `⚠️ Approved by ${who}, but their account label didn't update, so they still can't open /party. Use Let in again in /admin/submissions.`
    case 'failed': return `⚠️ ${who} clicked, but it did not go through. Try again, or decide in /admin/submissions.`
  }
}

// Rewrites the original message: same content, the buttons swapped for the outcome
async function updateMessage(responseUrl: string, message: BlockActionsPayload['message'], line: string) {
  const blocks = (message?.blocks ?? []).filter((block) => block.type !== 'actions')
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: line }] })
  try {
    // response_url looks like https://hooks.slack.com/actions/T0123/4567/abcDEF. The
    // payload is signed, but rebuild the address from Slack's host anyway, so only
    // the ID segments ever come from the request
    const match = SLACK_RESPONSE_URL.exec(responseUrl)
    if (!match) {
      console.error('Refusing to update a Slack message with an unexpected response URL')
      return
    }
    const path = match[1].split('/').map(encodeURIComponent).join('/')

    const response = await fetch(`https://hooks.slack.com/actions/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replace_original: true, text: message?.text ?? line, blocks }),
    })
    if (!response.ok) console.error('Failed to update the Slack message:', response.status, await response.text())
  } catch (error) {
    console.error('Failed to update the Slack message:', error)
  }
}
