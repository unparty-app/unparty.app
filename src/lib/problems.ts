import { prisma } from '@/lib/prisma'
import { groupProblems, type Problem } from '@/lib/worksheet'

/** The signed-in user's problems (their ProblemWorksheet submissions, grouped by idea) */
export async function getProblemsForUser(userId: string): Promise<Problem[]> {
  const rows = await prisma.userSubmission.findMany({
    where: { userId, type: 'FORM' },
    orderBy: { submittedAt: 'desc' },
    select: { id: true, content: true, status: true, submittedAt: true },
  })
  return groupProblems(rows)
}
