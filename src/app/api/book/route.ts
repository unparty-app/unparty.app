import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSKU } from '../../lib/sku-generator';
import { Book, CreateBookRequest } from './types';
import { createBookSchema } from './schema';
import { formatBook } from './format';
import { z } from 'zod';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedBooks: Book[] = books.map(formatBook);

    return NextResponse.json(formattedBooks);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

// Adding a book is /admin/books' job: an admin only
export async function POST(req: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  try {
    const body = await req.json() as CreateBookRequest;
    
    // Validate input
    const validatedData = createBookSchema.parse(body);
    
    // Generate unique SKU
    let sku: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      sku = generateSKU();
      const existing = await prisma.book.findUnique({
        where: { sku }
      });
      
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Failed to generate unique SKU' }, { status: 500 });
    }
    
    // Create the book
    const book = await prisma.book.create({
      data: {
        sku,
        title: validatedData.title,
        author: validatedData.author,
        quote: validatedData.quote,
        page: validatedData.page,
        publisher: validatedData.publisher,
        publisherLink: validatedData.publisherLink,
        condition: validatedData.condition,
      }
    });
    
    return NextResponse.json(formatBook(book), { status: 201 });
  } catch (error) {
    console.error('Error creating book:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input data',
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}
