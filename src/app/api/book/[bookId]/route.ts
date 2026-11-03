import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateBookSchema } from '../schema';
import { formatBook } from '../format';
import { z } from 'zod';
import { adminGuard } from '@/lib/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;

  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(formatBook(book));
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 });
  }
}

// Editing a book is /admin/books' job: an admin only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { bookId } = await params;

  try {
    const body = await req.json();
    const validatedData = updateBookSchema.parse(body);

    const book = await prisma.book.update({
      where: { id: bookId },
      data: validatedData,
    });

    return NextResponse.json(formatBook(book));
  } catch (error) {
    console.error('Error updating book:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}
