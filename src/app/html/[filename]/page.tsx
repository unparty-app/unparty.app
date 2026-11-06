import { readFile } from 'fs/promises';
import { join } from 'path';
import { notFound } from 'next/navigation';
import { knownSlugs } from '@/lib/known-routes';

type Props = {
  params: Promise<{ filename: string }>
}

export default async function HtmlPage({ params }: Props) {
  const { filename } = await params;
  
  // Read the HTML file from public directory; only the read can fail
  let htmlContent: string;
  try {
    htmlContent = await readFile(join(process.cwd(), 'public', `${filename}.html`), 'utf8');
  } catch (error) {
    console.error(`Failed to load ${filename}.html:`, error);
    notFound();
  }

  return (
    <div className="w-full" suppressHydrationWarning={true}>
      {/* Render HTML with full styling intact - suppress hydration warnings */}
      <div
        className="html-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        suppressHydrationWarning={true}
      />
    </div>
  );
}

// Every report in public/, from the route manifest, which lists them at
// build time (scripts/generate-route-manifest.cts), so a copy prerenders only
// what it ships. Never a readdir here: Vercel would bundle all of public/ into
// this function
export async function generateStaticParams() {
  return (knownSlugs('html') ?? []).map((filename) => ({ filename }));
}
