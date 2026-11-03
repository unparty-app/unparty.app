'use workflow';

/**
 * Durable workflow for handling problem worksheet submissions
 *
 * This workflow:
 * - Sends confirmation email to the user via Loops
 * - Notifies admins of the new submission
 * - Runs durably with automatic retries
 * - Persists state across interruptions
 */

interface ProblemSubmission {
  userId: string;
  email: string;
  name: string;
  ideaName: string;
  deadline: string;
  problem: string;
  role?: 'thinker' | 'builder' | 'connector' | 'generalist';
  isUpdate: boolean;
  submittedAt: string;
}

/**
 * Main workflow function for processing problem worksheet submissions
 */
export async function notifyProblemSubmission(submission: ProblemSubmission) {
  'use step';

  console.log(`[Workflow] Processing submission for ${submission.email}`);

  // Step 1: Send user confirmation email via Loops
  const userEmailResult = await sendUserConfirmationEmail(submission);

  // Step 2: Send admin notification
  const adminNotificationResult = await sendAdminNotification(submission);

  return {
    success: true,
    userEmailSent: userEmailResult.success,
    adminNotified: adminNotificationResult.success,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send confirmation email to the user via Loops
 */
async function sendUserConfirmationEmail(submission: ProblemSubmission) {
  'use step';

  const transactionalId = submission.isUpdate
    ? process.env.LOOPS_IDEA_UPDATED_ID
    : process.env.LOOPS_IDEA_SUBMITTED_ID;
  if (!process.env.LOOPS_API_KEY || !transactionalId) {
    console.warn('[Workflow] Loops key or template ID not configured, skipping user email');
    return { success: false, reason: 'Loops not configured' };
  }

  try {

    const payload = {
      transactionalId,
      email: submission.email,
      dataVariables: {
        name: submission.name,
        ideaName: submission.ideaName,
        deadline: new Date(submission.deadline).toLocaleDateString(),
        problem: submission.problem,
        isUpdate: submission.isUpdate,
      },
    };

    const response = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Loops API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Workflow] User confirmation email sent to ${submission.email}`);

    return { success: true, result };
  } catch (error) {
    console.error('[Workflow] Failed to send user confirmation email:', error);
    throw error; // Re-throw to trigger automatic retry
  }
}

/**
 * Send admin notification
 *
 * In the future, this could:
 * - Send email to admin via Loops
 * - Create task in Linear/Notion
 * - Post to Discord/Slack
 * - Update dashboard
 */
async function sendAdminNotification(submission: ProblemSubmission) {
  'use step';

  try {
    // For now, just log the submission
    // In the future, you can add actual admin notification logic here
    console.log('[Workflow] Admin notification:', {
      type: submission.isUpdate ? 'update' : 'new',
      userId: submission.userId,
      email: submission.email,
      ideaName: submission.ideaName,
      submittedAt: submission.submittedAt,
    });

    // TODO: Add actual admin notification (email, Slack, etc.)
    // Example:
    // if (process.env.ADMIN_EMAIL) {
    //   await sendLoopsEmail(process.env.ADMIN_EMAIL, 'admin-problem-submission', submission);
    // }

    return { success: true };
  } catch (error) {
    console.error('[Workflow] Failed to send admin notification:', error);
    throw error; // Re-throw to trigger automatic retry
  }
}
