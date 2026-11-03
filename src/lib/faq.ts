import faq from '@/data/FaqConfig.json';
import { SITE_URL } from '@/app/constants/organization';

// The site's FAQ (src/data/FaqConfig.json): the owner's questions and answers
// in groups, shown on /faq in the /admin settings language. Unpublished, /faq
// 404s in production and the footer leaves it out, so drafts never go live;
// answers marked draft are for the owner to rewrite in their voice first.
export interface FaqQuestion {
  id: string;
  q: string;
  a: string;
  link?: { label: string; href: string };
  draft?: boolean;
  group: string;
}

export interface FaqGroup {
  id: string;
  label: string;
  // A hand-drawn icon name (components/icons) for the group's nav row
  icon: string;
}

export const FAQ_PUBLISHED = faq.published === true;
export const FAQ_QUESTIONS: FaqQuestion[] = faq.questions;
export const FAQ_GROUPS: FaqGroup[] = faq.groups;

/** FAQPage structured data: each question with its accepted answer, in plain text */
export function faqJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${SITE_URL}/faq`,
    mainEntity: FAQ_QUESTIONS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
