import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { notFound } from 'next/navigation';

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

// Every report in public/, the same rule as the route manifest
// (scripts/generate-route-manifest.cts), so a copy prerenders only what it ships
export async function generateStaticParams() {
  const files = await readdir(join(process.cwd(), 'public'));
  return files.filter((file) => file.endsWith('.html')).map((file) => ({ filename: file.replace(/\.html$/, '') }));
}
