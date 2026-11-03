import { dbOn, noDatabase } from '@/lib/db-on';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';
import { cleanWordTypes, parseWorksheetContent } from '@/lib/worksheet';
import { WAITLIST_ON } from '@/app/constants/organization';
import { isBuildType } from '@/lib/word-types';
import { MAX_ANSWER_LENGTH } from '@/lib/answer-slots';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const latest = await prisma.userSubmission.findFirst({
      where: { userId, type: 'FORM' },
      orderBy: { submittedAt: 'desc' },
      select: { content: true, status: true, submittedAt: true, processedAt: true },
    });

    // The latest submission prefills the worksheet, so an edit starts from what they sent
    let entry = null;
    let submission = null;
    if (latest) {
      const fields = parseWorksheetContent(latest.content);
      if (fields) entry = { ...fields, updatedAt: latest.submittedAt.toISOString() };
      submission = { status: latest.status, submittedAt: latest.submittedAt, processedAt: latest.processedAt };
    }

    return NextResponse.json({ entry, submission });
  } catch (error) {
    console.error('Error fetching worksheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (!dbOn()) return noDatabase();

    const body = await request.json();
    const { email, name, ideaName, deadline, questionIds } = body;
    // The problem's own color, from the worksheet's palette; anything else is dropped
    const color = typeof body.color === 'string' && /^#[0-9a-f]{6}$/i.test(body.color) ? body.color : undefined;

    // Validate the required fields
    if (!email || !name || !ideaName || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // Is this an edit? Yes when they already have a worksheet waiting for a decision.
    // Read before this submission's row is created (#726).
    // Picks the "updated" email and Slack label; it doesn't stop the new row (#726)
    let isUpdate = false;
    try {
      isUpdate = !!(await prisma.userSubmission.findFirst({
        where: { userId, type: 'FORM', status: 'PENDING' },
        select: { id: true },
      }));
    } catch (lookupError) {
      console.error('Failed to check for a waiting worksheet (non-fatal):', lookupError);
    }

    // Complete any action-based steps triggered by this submission (best-effort, does not fail the request)
    try {
      const { recordActionForUser } = await import('@/lib/step-progress');
      await recordActionForUser(userId, 'problem_worksheet');
    } catch (actionError) {
      console.error('Failed to record problem_worksheet action (non-fatal):', actionError);
    }

    // Fetch the user's answers to any embedded founder questions (best-effort, shared by the
    // UserSubmission record below and the Slack notification)
    let answeredQuestions: { text: string; responseData: unknown }[] = [];
    if (Array.isArray(questionIds) && questionIds.length > 0) {
      try {
        const responses = await prisma.userQuestionResponse.findMany({
          where: { userId, questionId: { in: questionIds } },
          include: { question: { select: { text: true } } }
        });
        answeredQuestions = responses.map(r => ({ text: r.question.text, responseData: r.responseData }));
      } catch (fetchError) {
        console.error('Failed to fetch question answers (non-fatal):', fetchError);
      }
    }

    // Answers given in words (#389): each the worksheet's prompt and the five words
    // picked from the site's cloud. They travel with the submission instead of
    // being saved as question responses, so no ranking question's answers change
    if (Array.isArray(body.wordAnswers)) {
      for (const answer of body.wordAnswers.slice(0, 10)) {
        const text = typeof answer?.text === 'string' ? answer.text.trim().slice(0, 300) : '';
        const words = Array.isArray(answer?.words)
          ? answer.words.filter((w: unknown): w is string => typeof w === 'string' && w.length > 0 && w.length <= 40).slice(0, 5)
          : [];
        if (text && words.length) answeredQuestions.push({ text, responseData: words });
      }
    }
    // Answers written out (#265): the challenge's questions, in the reader's own
    // words, which is what their word cloud is counted from
    if (Array.isArray(body.textAnswers)) {
      for (const answer of body.textAnswers.slice(0, 10)) {
        const text = typeof answer?.text === 'string' ? answer.text.trim().slice(0, 300) : '';
        const written = typeof answer?.answer === 'string' ? answer.answer.trim().slice(0, MAX_ANSWER_LENGTH) : '';
        if (text && written) answeredQuestions.push({ text, responseData: written });
      }
    }
    // The kind of build those words point to, by the owner's tags and their own
    const buildType = isBuildType(body.buildType) ? body.buildType : undefined;
    const wordTypes = cleanWordTypes(body.wordTypes);

    // Create the reviewable UserSubmission record — this is what the waitlist admin-review
    // flow (GitHub Discussion approval → /admin/submissions) gates on, and the only store of
    // worksheets (/admin/problems reads these rows too).
    let submissionId: string | null = null;
    try {
      const submission = await prisma.userSubmission.create({
        data: {
          userId,
          type: 'FORM',
          content: JSON.stringify({ email, name, ideaName, deadline, color, answeredQuestions, ...(buildType && { buildType }), ...(Object.keys(wordTypes).length && { wordTypes }) }),
        },
      });
      submissionId = submission.id;
    } catch (submissionError) {
      console.error('Failed to create UserSubmission (non-fatal):', submissionError);
    }

    // Create a GitHub Discussion for admin review (best-effort, does not fail the request)
    // A Discussion is for reviewing a waitlist entry; with no waitlist there's nothing to review.
    // An edit while still pending (isUpdate) is the same application, already in its Discussion,
    // so it gets the new row (the problem's history) but no second thread (#726)
    if (submissionId && WAITLIST_ON && !isUpdate) {
      try {
        const { createProblemSubmissionDiscussion } = await import('@/lib/github');
        const discussion = await createProblemSubmissionDiscussion({
          id: submissionId,
          userId,
          email,
          name,
          ideaName,
          deadline,
        });
        console.log(`Created GitHub discussion for submission ${submissionId}: ${discussion.url}`);

        try {
          await prisma.userSubmission.update({
            where: { id: submissionId },
            data: { discussionId: discussion.id },
          });
        } catch (persistError) {
          console.error('Failed to persist discussionId (non-fatal):', persistError);
        }
      } catch (discussionError) {
        console.error('Failed to create GitHub discussion for submission (non-fatal):', discussionError);
      }
    }

    // Send user confirmation email via Loops (best-effort, does not fail the request)
    try {
      // Loops transactional template IDs come from the site owner's own Loops account
      // (Transactional → template → Details), set in .env. No template, no email
      const transactionalId = isUpdate
        ? process.env.LOOPS_IDEA_UPDATED_ID
        : process.env.LOOPS_IDEA_SUBMITTED_ID;
      if (process.env.LOOPS_API_KEY && transactionalId) {

        const loopsPayload = {
          transactionalId,
          email: email,
          dataVariables: {
            name: name,
            ideaName: ideaName,
            deadline: new Date(deadline).toLocaleDateString(),
            isUpdate,
          },
        };

        const loopsResponse = await fetch('https://app.loops.so/api/v1/transactional', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
          },
          body: JSON.stringify(loopsPayload),
        });

        if (!loopsResponse.ok) {
          console.error(`Loops email failed for ${email}:`, loopsResponse.status, await loopsResponse.text());
        } else {
          console.log(`User confirmation email sent to ${email}`);
        }
      }
    } catch (emailError) {
      console.error('User email notification failed (non-fatal):', emailError);
    }

    // A person's words in a Slack message: & < > are what Slack reads as links and @channel
    const slackText = (value: unknown) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Send admin notification via Slack (best-effort, does not fail the request)
    try {
      if (process.env.SLACK_WEBHOOK_URL) {
        const slackPayload = {
          text: isUpdate ? '📝 Problem Worksheet Updated' : '✨ New Problem Worksheet Submission',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: isUpdate ? '📝 Problem Worksheet Updated' : '✨ New Problem Worksheet Submission',
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Name:*\n${name}` },
                { type: 'mrkdwn', text: `*Email:*\n${email}` },
                { type: 'mrkdwn', text: `*Idea:*\n${ideaName}` },
                { type: 'mrkdwn', text: `*Deadline:*\n${new Date(deadline).toLocaleDateString()}` },
              ],
            },
            ...answeredQuestions.map(q => ({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${slackText(q.text)}*\n${slackText(Array.isArray(q.responseData) ? q.responseData.join(' → ') : q.responseData)}`,
              },
            })),
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Submitted at ${new Date(timestamp).toLocaleString()} • ${isUpdate ? 'Update' : 'New'}`,
                },
              ],
            },
            // Approve / Reject right in Slack (/api/slack/interactions), shown once the
            // Slack app's buttons are switched on, which is what SLACK_SIGNING_SECRET means
            ...(WAITLIST_ON && process.env.SLACK_SIGNING_SECRET && submissionId
              ? [{
                  type: 'actions',
                  elements: [
                    {
                      type: 'button',
                      action_id: 'approve_submission',
                      text: { type: 'plain_text', text: 'Approve' },
                      style: 'primary',
                      value: submissionId,
                    },
                    {
                      type: 'button',
                      action_id: 'reject_submission',
                      text: { type: 'plain_text', text: 'Reject' },
                      style: 'danger',
                      value: submissionId,
                      confirm: {
                        title: { type: 'plain_text', text: 'Reject this worksheet?' },
                        text: { type: 'mrkdwn', text: `${name} will see that it was not approved this round, and can update and resubmit.` },
                        confirm: { type: 'plain_text', text: 'Reject' },
                        deny: { type: 'plain_text', text: 'Cancel' },
                      },
                    },
                  ],
                }]
              : []),
          ],
        };

        const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload),
        });

        // Handle both Incoming Webhook (plain text) and Web API (JSON) responses
        try {
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            // Future Web API: returns JSON {ok: boolean, error?: string}
            const data = await response.json();
            if (!data.ok) {
              console.error('Slack API Error:', data.error);
            } else {
              console.log(`Admin notification sent to Slack for ${email}`);
            }
          } else {
            // Current Incoming Webhooks: return plain text "ok"
            if (response.ok) {
              console.log(`Admin notification sent to Slack for ${email}`);
            } else {
              const errorText = await response.text();
              console.error('Slack webhook failed:', response.status, response.statusText, errorText);
            }
          }
        } catch {
          // Fallback if response parsing fails
          if (response.ok) {
            console.log(`Admin notification sent to Slack for ${email}`);
          } else {
            console.error('Slack request failed:', response.status, response.statusText);
          }
        }
      }
    } catch (slackError) {
      console.error('Slack notification failed (non-fatal):', slackError);
    }

    // TODO: Enable Workflow SDK for durable notifications when ready for production
    // See: src/workflows/problem-notification.ts
    // Uncomment when ready to use Vercel Workflow:
    // try {
    //   const { start } = await import('workflow/api');
    //   const { notifyProblemSubmission } = await import('@/workflows/problem-notification');
    //   const submission = { userId, email, name, ideaName, deadline, problem, isUpdate, submittedAt: timestamp };
    //   await start(notifyProblemSubmission, [submission]);
    // } catch (workflowError) {
    //   console.error('Failed to start notification workflow (non-fatal):', workflowError);
    // }

    return NextResponse.json({
      success: true,
      entry: { email, name, ideaName, deadline, color, updatedAt: timestamp },
    });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}