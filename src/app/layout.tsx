  import type { Metadata, Viewport } from "next";
  import { SITE_URL, SITE_TITLE, SITE_TAGLINE } from "./constants/organization";
  import ClerkThemeProvider from "./components/ClerkThemeProvider";
  import localFont from "next/font/local";
  import { nunito, spaceGrotesk, vt323, majorMono, geistMono as geistMonoGoogle } from "./fonts";
  import Header from "./components/Header";
  import PageNavigation from "./components/PageNavigation";
import StoryNavigation from "./components/StoryNavigation";
import ComponentNavigation from "./components/ComponentNavigation";
  import Fab from "./components/Fab";
  import Footer from "./components/Footer";
  import GlobalSearch from "./components/GlobalSearch"
import WidgetDock from "./components/WidgetDock";
  import { AnalyticsConsentProvider } from "./contexts/AnalyticsConsentContext";
  import AnalyticsGate from "./components/AnalyticsGate";
  import CookieConsentBanner from "./components/CookieConsentBanner";
  import { ThemeProvider } from "./contexts/ThemeContext";
  import { AppSettingsProvider } from "./contexts/AppSettingsContext";
  import { getKeywordHighlightingEnabled } from "@/lib/appSettings";
  import { CoverProvider } from "./contexts/CoverContext";
import { ArticleHeaderProvider } from "./contexts/ArticleHeaderContext";
import { WatchModalProvider } from "./contexts/WatchModalContext";
  import { generatePageMetadata } from "./utils/ogMetadata";
  import "./globals.css";
import Banner from "./components/Banner";
import StatsLayoutWrapper from "./components/StatsLayoutWrapper";
import BuiltFrom from "./components/BuiltFrom";
import { builtFromCards } from "@/lib/built-from";
import { projectBelts } from "@/lib/project-belt";
import ReleaseDownloads from "./components/ReleaseDownloads";
import { FORCE_DARK_MODE } from "./constants/theme";
import { BRAND_COLOR } from "./constants/colors";






  


  const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
  });

  const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
  });

  
  // viewport-fit=cover lets the fixed chrome extend under the phone status
  // bar; theme-color tints that bar in mobile browsers. The static value is
  // the site's brand color (the default mood) — ThemeContext keeps the meta
  // tag synced to the live mood color client-side.
  export const viewport: Viewport = {
    themeColor: BRAND_COLOR,
    viewportFit: "cover",
  };

  export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    ...generatePageMetadata({
      title: SITE_TITLE,
      description: SITE_TAGLINE,
      category: "STORY",
      coverId: "cover-003",
    }),
  };

  export default async function RootLayout({
    children,
    modal,
  }: Readonly<{
    children: React.ReactNode;
    modal: React.ReactNode;
  }>) {
    const keywordHighlightingEnabled = await getKeywordHighlightingEnabled();

    return (
      <ClerkThemeProvider>
      <html
        lang="en"
        className={`h-full${FORCE_DARK_MODE ? " dark" : ""}`}
        // The owner's brand color for globals.css (--brand-color), and the
        // first paint's theme color before ThemeContext loads a visitor's mood
        style={{ "--brand-color": BRAND_COLOR, "--theme-color": BRAND_COLOR } as React.CSSProperties}
        suppressHydrationWarning
      >
        <body className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${spaceGrotesk.variable} ${vt323.variable} ${majorMono.variable} ${geistMonoGoogle.variable} min-h-full overflow-y-auto antialiased`}>
          {/* Sets the `dark` class before first paint. With FORCE_DARK_MODE
              the class is already server-rendered; otherwise this follows the
              OS preference (and keeps following it live). */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var f=${FORCE_DARK_MODE};var m=window.matchMedia("(prefers-color-scheme: dark)");var apply=function(){document.documentElement.classList.toggle("dark",f||m.matches)};apply();m.addEventListener("change",apply)})()`,
            }}
          />
          <ThemeProvider>
            <AppSettingsProvider keywordHighlightingEnabled={keywordHighlightingEnabled}>
            <AnalyticsConsentProvider>
            <CoverProvider>
            <ArticleHeaderProvider>
            <WatchModalProvider>


            {/* Fixed Header at top level - Premium edge-to-edge design.
                id="site-chrome" lets scroll-pinned UI (StickyHeroStack) measure
                the chrome's real height instead of assuming 64px rows. Clear,
                so the Header's own glass blurs the page behind it. */}
            <div id="site-chrome" className="fixed inset-x-0 top-0 z-50">
              <Header />
            </div>
            
            {/* Main content after about section - Mobile-first responsive */}
            <div
              className="mx-auto grid min-h-screen max-w-screen-lg grid-rows-[1fr_auto] items-start justify-items-center gap-6 px-4 pb-6 pt-[calc(5rem+env(safe-area-inset-top))] sm:gap-8 sm:px-6 sm:pb-8 md:justify-items-start md:pb-12 lg:gap-12 lg:px-12 lg:pb-16"
              style={{
                minHeight: '100vh'
              }}
            >
              <main id="page-top" className="row-start-1 w-full min-w-0">
                <div className="page-transition-wrapper">
                  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Full-width layout for better component experience */}

                   

                    <div className="w-full">
                     
                     
                      {children}
                    </div>

                    {/* A project page's "built from." row: its components, each
                        leading to its article. Looked up here, on the server, so
                        the article registry never reaches the browser; the row
                        picks its project by path and is empty everywhere else */}
                    <div className="mx-auto w-full max-w-5xl">
                      <BuiltFrom cards={builtFromCards()} />
                    </div>
                    
                    
                     {/* The belt under a project page (stage, hours, releases, the
                         ask): only which projects have one rides along here; the
                         page loads its own (/api/belt/<project>) */}
                     <StatsLayoutWrapper projects={Object.keys(projectBelts())} />

                     {/* The way on from a page in a run (unppp pages, stories,
                         problems), in the page itself below 1200px, where the
                         floating side arrows would cover the content (PageNeighbors) */}
                     <div id="page-neighbors" />
                     
                   

                    {/* Non-essential analytics (GA + Vercel) only mount
                        after cookie-banner consent; Clerk's essential
                        session cookies are not gated. GA loads only when
                        the owner sets their own NEXT_PUBLIC_GA_ID. */}
                    <AnalyticsGate gaId={process.env.NEXT_PUBLIC_GA_ID} />
                  </div>
                </div>
              </main>

              {/* Footer in the 2nd track */}
            </div>

            {/* Floating Action Button for Auth */}
            <Fab />

            {/* First-visit analytics cookie consent (Accept / Reject) */}
            <CookieConsentBanner />

            {/* Counts downloads of released files, wherever they're linked */}
            <ReleaseDownloads />

            {/* Utility widget tray — collapsed dock above the Fab */}
            <WidgetDock />

            {/* Page Navigation Arrows */}
            <PageNavigation />
            <StoryNavigation />
            <ComponentNavigation />

            {/* Global Search Modal (Cmd+K / Ctrl+K) */}
            <GlobalSearch />

            {/* Modal slot - the intercepted /watch/[slug] lightbox overlays
                whatever's currently mounted in `children` above (see #956) */}
            {modal}

            <div id="page-bottom" className="w-full">

              <Footer />
            </div>

            {/* Article byline dock (title, category, theme song, mood), fixed at
                the bottom beside the Fab, so the top chrome stays a slim header
                and covers get the screen. Renders nothing off article pages. */}
            <Banner />

            </WatchModalProvider>
            </ArticleHeaderProvider>
          </CoverProvider>
            </AnalyticsConsentProvider>
            </AppSettingsProvider>
          </ThemeProvider>
        </body>
      </html>
      </ClerkThemeProvider>
    );
  }