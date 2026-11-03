export interface Book {
  id: string;
  sku: string;
  title: string;
  author: string;
  quote: string;
  page: number;
  publisher: string;
  publisherLink: string;
  inStock: boolean;
  claimedBy: string | null;
  claimedAt: string | null;
  condition: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}

export interface CreateBookRequest {
  title: string;
  author: string;
  quote?: string;
  page?: number;
  publisher?: string;
  publisherLink?: string;
  condition?: string;
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  quote?: string;
  page?: number;
  publisher?: string;
  publisherLink?: string;
  condition?: string;
}