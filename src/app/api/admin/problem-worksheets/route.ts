import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { parseWorksheetContent } from '@/lib/worksheet';

// Every worksheet ever submitted, newest first: one UserSubmission row per submit, so
// a reworked idea shows up once per version
export async function GET(request: Request) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;

    const search = new URL(request.url).searchParams.get('search')?.trim();

    const rows = await prisma.userSubmission.findMany({
      where: {
        type: 'FORM',
        // `content` holds the name, email and idea as JSON, so one match covers all three
        ...(search && {
          OR: [
            { content: { contains: search, mode: 'insensitive' } },
            { userId: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { submittedAt: 'desc' },
      select: { id: true, userId: true, content: true, status: true, submittedAt: true },
    });

    const entries = rows.flatMap(row => {
      const fields = parseWorksheetContent(row.content);
      if (!fields) return [];
      // The list shows who, what and when; the answers stay out of it
      const { answeredQuestions: _answers, ...summary } = fields;
      return [{
        id: row.id,
        userId: row.userId,
        ...summary,
        status: row.status,
        submittedAt: row.submittedAt.toISOString(),
      }];
    });

    return NextResponse.json({ entries, total: entries.length });
  } catch (error) {
    console.error('Error fetching problem worksheets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
