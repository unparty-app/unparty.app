import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { getProblemsForUser } from '@/lib/problems';

// The signed-in user's problems for /party: one per idea, newest first
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const problems = await getProblemsForUser(userId);
    return NextResponse.json({ problems });
  } catch (error) {
    console.error('Error fetching problems:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
