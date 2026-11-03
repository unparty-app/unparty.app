import type { Metadata } from 'next';
import { generatePageMetadata } from "@/app/utils/ogMetadata";
import { generateOrganizationJsonLd } from "@/app/utils/structuredData";
import JsonLd from "@/app/components/JsonLd";
import HomeClient from "./HomeClient";
import { SITE_NAME, SITE_HEADLINE, ORGANIZATION_DESCRIPTION } from "@/app/constants/organization";

export const metadata: Metadata = generatePageMetadata({
  title: `${SITE_NAME} — ${SITE_HEADLINE}`,
  description: ORGANIZATION_DESCRIPTION,
  category: 'APP',
  coverId: 'cover-036',
  path: '/',
});

export default function Home() {
  return (
    <>
      <JsonLd data={generateOrganizationJsonLd()} />
      <HomeClient />
    </>
  );
}

