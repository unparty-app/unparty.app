import { readFile } from 'fs/promises';
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

// Generate static params for known HTML files
export async function generateStaticParams() {
  // Add your HTML filenames here (without .html extension)
  const htmlFiles = [
    'claude_analytics',
    'natural_topic_discovery_dashboard',
    'repo-metadata-dashboard',
    'sprint_research',
    'sprintbrain',
    'techdebtproposal',
    'welcome-colors'
  ];
  
  return htmlFiles.map((filename) => ({
    filename: filename,
  }));
}