import { NextResponse } from 'next/server';
import { verify } from '@octokit/webhooks-methods';
import { parseProblemSubmissionFromDiscussion } from '@/lib/github';
import { approveSubmission } from '@/lib/waitlist';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET!;

/** Tell the owner in Slack (SLACK_WEBHOOK_URL) that an approval didn't unlock /party */
async function alertLabelFailed(submissionId: string) {
  console.error(`Approved submission ${submissionId}, but Clerk's waitlistStatus label was not set`);
  if (!process.env.SLACK_WEBHOOK_URL) return;
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `⚠️ A worksheet approved in GitHub (${submissionId}) didn't unlock /party: their account label wasn't set. Use Let in again in /admin/submissions.`,
      }),
    });
  } catch (error) {
    console.error('Slack alert for a failed waitlist label did not send:', error);
  }
}

export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify webhook signature
    const isValid = await verify(WEBHOOK_SECRET, body, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the payload
    const payload = JSON.parse(body);
    const event = request.headers.get('x-github-event');

    console.log(`Received GitHub webhook event: ${event}`);

    // Handle discussion events
    if (event === 'discussion') {
      const action = payload.action;
      const discussion = payload.discussion;

      // Only process category changes
      if (action === 'category_changed') {
        const newCategory = discussion.category?.name;
        const discussionBody = discussion.body;

        console.log(`Discussion category changed to: ${newCategory}`);

        // Check if moved to "Approve" category
        if (newCategory === 'Approve') {
          const submissionInfo = parseProblemSubmissionFromDiscussion(discussionBody);

          if (!submissionInfo) {
            console.error('Could not parse submission info from discussion body');
            return NextResponse.json({ error: 'Invalid discussion format' }, { status: 400 });
          }

          const { submissionId } = submissionInfo;

          // Same approval as /admin/submissions: record it, set the Clerk label
          // the proxy checks, and email them when Loops is configured
          const result = await approveSubmission(submissionId, 'github_ui');
          if (result.outcome === 'not_found') {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
          }
          // Approved in the database but Clerk didn't take the label, so they're still
          // locked out. Nobody reads this route's logs, so say it in Slack (#752)
          if (!result.labelSet) await alertLabelFailed(submissionId);
          if (result.outcome === 'already_approved') {
            console.log(`Submission ${submissionId} already approved, skipping duplicate processing`);
            return NextResponse.json({ success: true, message: 'Already approved' });
          }

          return NextResponse.json({
            success: true,
            message: `Submission ${submissionId} approved`,
            submission: result.submission,
          });
        }
      }

      // Acknowledge other discussion events without processing
      return NextResponse.json({ success: true, message: 'Event acknowledged' });
    }

    // Return 200 for other events
    return NextResponse.json({ success: true, message: 'Event not processed' });

  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
