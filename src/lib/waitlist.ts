import { prisma } from '@/lib/prisma'
import { clerkClient } from '@/lib/auth-stub.server'

export type ApprovedVia = 'github_ui' | 'admin' | 'slack'

/** labelSet: whether Clerk took waitlistStatus: 'approved', the label the middleware
 * checks. false means the decision is recorded but they still can't open /party (#752) */
export type ApproveResult =
  | { outcome: 'approved'; labelSet: boolean; submission: Awaited<ReturnType<typeof prisma.userSubmission.update>> }
  | { outcome: 'already_approved'; labelSet: boolean }
  | { outcome: 'not_found' }

/**
 * Of these users, the ones whose Clerk account lacks the label that opens /party
 * (waitlistStatus: 'approved', or role: 'admin'). For /admin/submissions, to catch
 * an approval the database has but Clerk doesn't (#752). null when Clerk can't be
 * asked; an account Clerk no longer has isn't counted
 */
export async function usersMissingApprovedLabel(userIds: string[]): Promise<Set<string> | null> {
  const ids = [...new Set(userIds)]
  if (ids.length === 0) return new Set()
  try {
    const client = await clerkClient()
    const { data: users } = await client.users.getUserList({ userId: ids, limit: ids.length })
    return new Set(
      users
        .filter((u) => u.publicMetadata?.role !== 'admin' && u.publicMetadata?.waitlistStatus !== 'approved')
        .map((u) => u.id)
    )
  } catch (error) {
    console.error('Could not check waitlist labels in Clerk:', error)
    return null
  }
}

/** Set the label that opens /party. Safe to repeat, so approving again repairs a failed write */
async function setApprovedLabel(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { waitlistStatus: 'approved' },
    })
    return true
  } catch (clerkError) {
    console.error('Failed to update Clerk waitlistStatus metadata:', clerkError)
    return false
  }
}

/**
 * Approve a waitlist submission: the one path shared by /admin/submissions, the
 * Slack Approve button and the GitHub Discussion → "Approve" webhook, so all
 * three let the person in.
 *
 * 1. Marks the UserSubmission APPROVED (the record of the decision)
 * 2. Sets Clerk publicMetadata.waitlistStatus = 'approved', which is what
 *    src/middleware.ts actually checks to open /party
 * 3. Emails them through Loops when LOOPS_API_KEY and LOOPS_WAITLIST_APPROVED_ID are set
 *
 * Steps 2 and 3 are best-effort: the decision is recorded even if they fail.
 * Approving an approved submission again only re-sets the label, which is how a
 * failed Clerk write gets repaired (the result's labelSet says whether it took).
 */
export async function approveSubmission(submissionId: string, approvedVia: ApprovedVia): Promise<ApproveResult> {
  const existing = await prisma.userSubmission.findUnique({
    where: { id: submissionId },
    select: { status: true, userId: true },
  })
  if (!existing) return { outcome: 'not_found' }
  if (existing.status === 'APPROVED') {
    return { outcome: 'already_approved', labelSet: await setApprovedLabel(existing.userId) }
  }

  const submission = await prisma.userSubmission.update({
    where: { id: submissionId },
    data: { status: 'APPROVED', processedAt: new Date(), approvedVia },
  })

  // Unlock /party for this user
  const labelSet = await setApprovedLabel(submission.userId)

  // Tell them
  try {
    // The template's ID from the site owner's own Loops account (.env), never a
    // value in code
    const transactionalId = process.env.LOOPS_WAITLIST_APPROVED_ID
    if (process.env.LOOPS_API_KEY && transactionalId) {
      const content = submission.content ? JSON.parse(submission.content) : {}
      const loopsResponse = await fetch('https://app.loops.so/api/v1/transactional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        },
        body: JSON.stringify({
          transactionalId,
          email: content.email,
          dataVariables: {
            name: content.name,
            ideaName: content.ideaName,
          },
        }),
      })

      if (!loopsResponse.ok) {
        console.error('Loops waitlist-approved email failed:', loopsResponse.status, await loopsResponse.text())
      }
    }
  } catch (emailError) {
    console.error('Failed to send waitlist-approved email (non-fatal):', emailError)
  }

  console.log(`Approved waitlist submission ${submissionId} for user ${submission.userId} (${approvedVia})`)
  return { outcome: 'approved', labelSet, submission }
}
