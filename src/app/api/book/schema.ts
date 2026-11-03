import { z } from 'zod';

// Keep book quotes to a sentence or two — citation/attribution, not reproduction.
export const QUOTE_MAX_LENGTH = 300;

const quoteField = z
  .string()
  .max(
    QUOTE_MAX_LENGTH,
    `Quotes should be brief (max ${QUOTE_MAX_LENGTH} characters) — cite a page rather than reproducing a passage.`
  )
  .optional();

// A quote without a page + publisher isn't a real citation.
const requireAttributionWithQuote = (data: { quote?: string; page?: number; publisher?: string }) =>
  !data.quote || (!!data.page && !!data.publisher);

const attributionRefinement = {
  message: 'A quote requires both a page number and publisher for proper attribution.',
  path: ['quote'],
};

export const createBookSchema = z
  .object({
    title: z.string().min(1),
    author: z.string().min(1),
    quote: quoteField,
    page: z.number().int().positive().optional(),
    publisher: z.string().optional(),
    publisherLink: z.string().url().optional(),
    condition: z.string().optional(),
  })
  .refine(requireAttributionWithQuote, attributionRefinement);

export const updateBookSchema = z
  .object({
    title: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    quote: quoteField,
    page: z.number().int().positive().optional(),
    publisher: z.string().optional(),
    publisherLink: z.string().url().optional(),
    condition: z.string().optional(),
  })
  .refine(requireAttributionWithQuote, attributionRefinement);
