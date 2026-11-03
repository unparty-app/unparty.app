import type { Metadata } from 'next';
import privacyPolicyText from '@/data/privacypolicy.json';
import { fillLegal } from '@/lib/legal';
import { generatePageMetadata } from '@/app/utils/ogMetadata';
import { SITE_TITLE } from '@/app/constants/organization';

// {site} and {email} filled from FoundersConfig (src/lib/legal.ts)
const privacyPolicy = fillLegal(privacyPolicyText);

export const metadata: Metadata = generatePageMetadata({
  title: 'Privacy Policy',
  description: `Privacy policy for ${SITE_TITLE} — how we collect, use, and protect your data.`,
  category: 'APP',
  coverId: 'cover-003',
  path: '/privacy',
});

// The active mood color is written to --theme-color on <html> by
// ThemeProvider, so this can stay a server component (keeps the
// metadata export) while still picking up the premium theme accent.
const themeAccent = { color: 'var(--theme-color, #f9c22e)' };
const themeBorder = { borderColor: 'var(--theme-color, #f9c22e)' };

const PrivacyPage = () => {
  const { 'Last Updated': lastUpdated, ...sections } = privacyPolicy as Record<
    string,
    Record<string, unknown> | string
  >;

  // Helper function to render content based on its type
  const renderContent = (content: Record<string, unknown> | string[] | string) => {
    if (typeof content === 'string') {
      return (
        <p className="font-google-sans-code text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {content}
        </p>
      );
    }

    if (Array.isArray(content)) {
      return (
        <div className="flex flex-col gap-4">
          {content.map((item, index) => (
            <div key={index} className="ml-4 border-l-2 pl-4" style={themeBorder}>
              {Object.entries(item).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <h4 className="text-md font-vt323 font-semibold" style={themeAccent}>{key}</h4>
                  <p className="font-google-sans-code text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {String(value)}
                  </p>
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
            <div key={title} className="group border-t-2 border-[color-mix(in_srgb,var(--theme-color,#f9c22e)_40%,transparent)] pt-3 pl-4 transition-colors duration-200 hover:border-[var(--theme-color,#f9c22e)]">
              <h3 className="mb-2 font-google-sans-code text-md uppercase font-semibold text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--theme-color,#f9c22e)]">
                {title}
              </h3>
              {typeof value === 'object' && value !== null && !Array.isArray(value)
                ? renderContent(value as Record<string, unknown>)
                : (
                  <p className="font-google-sans-code text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {String(value)}
                  </p>
                )
              }
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen w-full px-6 py-12" style={{ backgroundColor: 'var(--background)' }}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        {/* Hero */}
        <header className="flex flex-col gap-3">
          <span
            className="w-fit rounded-full border px-2.5 py-1 font-vt323 text-xs font-bold uppercase tracking-wide"
            style={{ ...themeAccent, ...themeBorder, backgroundColor: 'color-mix(in srgb, var(--theme-color, #f9c22e) 12%, transparent)' }}
          >
            APP. PRIVACY.
          </span>
          <h1 className="font-vt323 text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
            Privacy Policy
          </h1>
          {typeof lastUpdated === 'string' && (
            <p className="max-w-3xl font-google-sans-code text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {lastUpdated}
            </p>
          )}
        </header>

        {/* Sections */}
        {Object.entries(sections).map(([section, content]) => (
          <section
            key={section}
            className="rounded-2xl bg-[var(--background-highlight)] p-6 shadow-md backdrop-blur-sm"
          >
            <h2 className="mb-4 font-vt323 text-2xl font-bold uppercase tracking-wide" style={themeAccent}>
              {section}
            </h2>
            {renderContent(content)}
          </section>
        ))}
      </div>
    </main>
  );
};

export default PrivacyPage;
