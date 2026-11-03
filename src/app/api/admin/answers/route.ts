import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { ANSWER_SLOTS, MAX_ANSWER_LENGTH } from '@/lib/answer-slots';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, writeFoundersConfig } from '@/lib/founders-config-write';

// The owner's answers to the challenge's questions (FoundersConfig.json
// `answers`, #265): public, and counted with their writing (word-counts.ts).
// Saving sends all three. A reader's answers never come here: they travel with
// their worksheet (/api/problem/send)

// The whole value, reading each string whole: an answer can hold a } of its own
const ANSWERS = /"answers":\s*\{(?:[^"}]|"(?:[^"\\]|\\.)*")*\}/;

/** The config text with `answers` set, keeping the rest of the file's formatting */
function withAnswers(text: string, answers: Record<string, string>): string {
  const line = `"answers": ${JSON.stringify(answers)}`;
  // Replacer functions, so a $ in an answer stays a $
  const next = ANSWERS.test(text) ? text.replace(ANSWERS, () => line) : text.replace(/\n}\s*$/, () => `,\n  ${line}\n}\n`);
  JSON.parse(next); // A bad edit stops here, before it reaches the file
  return next;
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { answers } = (await request.json().catch(() => ({}))) as { answers?: Record<string, unknown> };
  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'answers must be an object of question → answer' }, { status: 400 });
  }

  const clean: Record<string, string> = {};
  for (const { id } of ANSWER_SLOTS) {
    const answer = answers[id] ?? '';
    if (typeof answer !== 'string') return NextResponse.json({ error: `${id} must be text` }, { status: 400 });
    if (answer.length > MAX_ANSWER_LENGTH) return NextResponse.json({ error: `${id} can be at most ${MAX_ANSWER_LENGTH} characters` }, { status: 400 });
    clean[id] = answer.trim();
  }

  if (!CAN_CHANGE_CONFIG) {
    return NextResponse.json({ error: `Set this in ${CONFIG_PATH} and redeploy`, line: `"answers": ${JSON.stringify(clean)}` }, { status: 409 });
  }

  try {
    const result = await writeFoundersConfig((text) => withAnswers(text, clean), {
      branch: 'answers',
      title: 'BRAND. Update the owner\'s answers to the challenge',
      body: 'From /admin → Your answers.',
    });
    return NextResponse.json({ answers: clean, ...result });
  } catch (error) {
    console.error('Saving answers failed:', error);
    return NextResponse.json({ error: 'Could not save your answers' }, { status: 500 });
  }
}
