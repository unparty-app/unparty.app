import { notFound } from 'next/navigation';
import JsonLd from '../components/JsonLd';
import FaqSettings from './FaqSettings';
import { generatePageMetadata } from '../utils/ogMetadata';
import { SITE_TITLE } from '../constants/organization';
import { FAQ_GROUPS, FAQ_PUBLISHED, FAQ_QUESTIONS, faqJsonLd } from '@/lib/faq';
import faq from '@/data/FaqConfig.json';

export const metadata = generatePageMetadata({
  title: faq.title,
  subtitle: faq.subtitle,
  description: faq.description,
  category: 'FAQ.',
  path: '/faq',
});

// /faq: the owner's questions and answers (src/data/FaqConfig.json) in the
// /admin settings language, with FAQPage structured data. Unpublished it
// previews on npm run dev and 404s in production
export default function FaqPage() {
  if (!FAQ_PUBLISHED && process.env.NODE_ENV === 'production') notFound();
  return (
    <>
      <JsonLd data={faqJsonLd()} />
      <FaqSettings title={SITE_TITLE} groups={FAQ_GROUPS} questions={FAQ_QUESTIONS} />
    </>
  );
}
