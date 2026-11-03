import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-stub.server';
import { getProblemsForUser } from '@/lib/problems';
import { problemToArticle } from '@/lib/worksheet';
import ProblemArticle from './ProblemArticle';

// One of the owner's problems, read in the article layout. Only its owner can
// open it; an unknown id goes back to /party rather than a 404
export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const problems = await getProblemsForUser(userId);
  const problem = problems.find((p) => p.id === id);
  if (!problem) redirect('/party');

  return (
    <ProblemArticle
      article={problemToArticle(problem, problem.latest.name)}
      routes={problems.map((p) => `/party/problem/${p.id}`)}
      labels={Object.fromEntries(problems.map((p) => [`/party/problem/${p.id}`, p.latest.ideaName]))}
    />
  );
}
