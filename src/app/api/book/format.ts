import { Book } from './types';

type BookRecord = {
  id: string;
  sku: string;
  title: string;
  author: string;
  quote: string | null;
  page: number | null;
  publisher: string | null;
  publisherLink: string | null;
  inStock: boolean;
  claimedBy: string | null;
  claimedAt: Date | null;
  condition: string | null;
  paymentStatus: string;
};

export function formatBook(book: BookRecord): Book {
  return {
    id: book.id,
    sku: book.sku,
    title: book.title,
    author: book.author,
    quote: book.quote || '',
    page: book.page || 0,
    publisher: book.publisher || '',
    publisherLink: book.publisherLink || '',
    inStock: book.inStock,
    claimedBy: book.claimedBy,
    claimedAt: book.claimedAt?.toISOString() || null,
    condition: book.condition || '',
    paymentStatus: book.paymentStatus as Book['paymentStatus'],
  };
}
