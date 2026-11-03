import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/articles/[slug]/thoughts/[id]
 *
 * Delete a thought: its author can, and an admin can delete any. It's marked
 * DELETED rather than removed, so it leaves the page but can be restored.
 * 204 on success, 401 signed out, 403 not yours, 404 not on this article.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Sign in to delete a thought.' }, { status: 401 });

  const thought = await prisma.thought.findFirst({
    where: { id, articleSlug: slug, status: 'VISIBLE' },
    select: { userId: true },
  });
  if (!thought) return NextResponse.json({ error: 'Thought not found' }, { status: 404 });
  if (thought.userId !== userId && !(await isAdmin())) {
    return NextResponse.json({ error: 'You can only delete your own thoughts.' }, { status: 403 });
  }

  await prisma.thought.update({ where: { id }, data: { status: 'DELETED' } });
  return new NextResponse(null, { status: 204 });
}
