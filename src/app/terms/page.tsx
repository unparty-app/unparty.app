import type { Metadata } from 'next';
import termsOfUseText from '@/data/termsofuse.json';
import { fillLegal } from '@/lib/legal';
import { generatePageMetadata } from '@/app/utils/ogMetadata';
import { SITE_TITLE } from '@/app/constants/organization';

// {site} and {email} filled from FoundersConfig (src/lib/legal.ts)
const termsOfUse = fillLegal(termsOfUseText);

export const metadata: Metadata = generatePageMetadata({
  title: 'Terms of Use',
  description: `Terms of use for ${SITE_TITLE} — the rules and guidelines for using our platform.`,
  category: 'APP',
  coverId: 'cover-003',
  path: '/terms',
});

// Define specific types for the JSON structure
type ContentItem = Record<string, string>;
interface ContentObject {
  [key: string]: string | ContentObject | Array<ContentItem | string>;
}
type ContentValue = string | ContentObject | Array<ContentItem | string>;
type ContentSection = Record<string, ContentValue>;

const TermsPage = () => {
  // Function to convert markdown-style formatting to HTML
  const formatMarkdown = (text: string): string => {
    // Handle bold text (** **)
    const boldFormatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle bullet points
    const bulletFormatted = boldFormatted.replace(/- (.*?)(?=\n|$)/g, '<li>$1</li>');
    
    // Wrap bullet points in ul if they exist
    const withBullets = bulletFormatted.includes('<li>') 
      ? bulletFormatted.replace(/(<li>.*?<\/li>)+/g, '<ul class="list-disc ml-5 my-2">$&</ul>') 
      : bulletFormatted;
    
    return withBullets;
  };
  

  // Helper function to render content based on its type
  const renderContent = (content: ContentValue): React.JSX.Element => {
    if (typeof content === 'string') {
      return (
        <div 
          className="font-google-sans-code text-zinc-200"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
        />
      );
    }
    
    if (Array.isArray(content)) {
      return (
        <div className="flex flex-col gap-4">
          {content.map((item, index) => (
            <div key={index} className="ml-4 border-l-2 border-gray-200 pl-4">
              {Object.entries(item).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <h4 className="text-md font-rounded font-medium text-yellow-500">{key}</h4>
                  <div 
                    className="font-google-sans-code text-sm text-zinc-50"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(String(value)) }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-4">
        {Object.entries(content).map(([title, value]) => {
          return (
            <div key={title}>
              <h3 className="text-50 mb-2 font-rounded text-lg font-medium">{title}</h3>
              {typeof value === 'object' && value !== null 
                ? renderContent(value as ContentValue) 
                : <div 
                    className="font-google-sans-code text-zinc-50"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(String(value)) }}
                  />
              }
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <div className="flex flex-col gap-8">
        {Object.entries(termsOfUse as ContentSection).map(([section, content]) => (
          <section key={section} className="border-b pb-4">
            <h2 className="mb-4 font-rounded text-2xl font-semibold text-yellow-500">{section}</h2>
            {renderContent(content)}
          </section>
        ))}
      </div>
    </main>
  );
};

export default TermsPage;