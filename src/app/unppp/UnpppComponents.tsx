'use client';
import React from 'react';



// Import all unused components for audit
import EmailTracker from '../components/EmailTracker';
import FeatureVote from '../components/FeatureVote';
import FeatureWrapper from '../components/FeatureWrapper';
import HStack from '../components/HStack';
import Hope from '../components/Hope';
import LiveScale from '../components/LiveScale';
import NavRow from '../components/NavRow';
import PageHeader from '../components/PageHeader';
import PageRow from '../components/PageRow';
import PageTable from '../components/PageTable';
import { EmbeddableRepoFocus } from '../components/editorial/EmbeddableComponents';
import SVG from '../components/SVG';
import SVGUpload from '../components/SVGUpload';
// Search component removed - now uses GlobalSearch modal (Cmd+K)
import Sidebar from '../components/Sidebar';
// Safe component renderers to avoid union type issues
const ComponentRenderers = {
 

  EmailTracker: () => <EmailTracker />,
  FeatureVote: () => <FeatureVote unpppId="sample-feature" featureName="Sample Feature" description="A sample feature description" />,
  FeatureWrapper: () => <FeatureWrapper title="Sample Feature" linkHref="/unppp">Sample Content</FeatureWrapper>,
  HStack: () => <HStack>HStack Content</HStack>,
  Hope: () => <Hope />,
  LiveScale: () => <LiveScale />,
  NavRow: () => <NavRow />,
  PageHeader: () => <PageHeader />,
  PageRow: () => <PageRow />,
  PageTable: () => <PageTable />,
  RepoFocus: () => <EmbeddableRepoFocus source="focus" />,
  SVG: () => <SVG />,
  SVGUpload: () => <SVGUpload />,
  Sidebar: () => <Sidebar />,
 
};

// Component list for rendering
const COMPONENT_NAMES = Object.keys(ComponentRenderers) as Array<keyof typeof ComponentRenderers>;

const UnpppPage = () => {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="font-google-sans-code text-4xl font-bold text-gray-900 dark:text-white">
            UNINVITED UNPPP&#39;S 
          </h1>
          <p className="mt-4 font-google-sans-code text-lg text-gray-600 dark:text-gray-400">
             # {COMPONENT_NAMES.length} AVAILABLE
          </p>
          <p className="mt-2 font-google-sans-code text-sm text-gray-500 dark:text-gray-500">
            VOTE TO INFLUENCE THE LIST
          </p>
        </div>

        

        

        {/* Components Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COMPONENT_NAMES.map((name) => (
            <div
              key={name}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-3">
                <h3 className="font-google-sans-code text-sm font-bold text-gray-900 dark:text-white">
                  {name}
                </h3>
              </div>
              
              {/* Component Wrapper with Error Boundary */}
              <div className="min-h-[100px] overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
                <ErrorBoundary componentName={name}>
                  {ComponentRenderers[name]()}
                </ErrorBoundary>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-yellow-100 px-2 py-1 font-google-sans-code text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  UNUSED
                </span>
                <button className="font-google-sans-code text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Review →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Components that need special handling */}
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-700/50 dark:bg-orange-900/10">
          <h2 className="mb-4 font-google-sans-code text-xl font-bold text-orange-900 dark:text-orange-100">
            NOT READY
          </h2>
          <p className="mb-4 font-google-sans-code text-sm text-orange-700 dark:text-orange-300">
            THESE UNPPPS ARE NOT READY TO PREVIEW
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div className="rounded-lg border border-orange-200 bg-white p-3 dark:border-orange-600 dark:bg-gray-800">
              <span className="font-google-sans-code text-sm font-medium text-orange-900 dark:text-orange-100">
                CoverPreviewModal
              </span>
            </div>
            <div className="rounded-lg border border-orange-200 bg-white p-3 dark:border-orange-600 dark:bg-gray-800">
              <span className="font-google-sans-code text-sm font-medium text-orange-900 dark:text-orange-100">
                Modal
              </span>
            </div>
          </div>
        </div>

        {/* MDX Components Section */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-700/50 dark:bg-blue-900/10">
          <h2 className="mb-4 font-google-sans-code text-xl font-bold text-blue-900 dark:text-blue-100">
            TALKERS
          </h2>
          <p className="mb-4 font-google-sans-code text-sm text-blue-700 dark:text-blue-300">
            THESE UNPPPS NEED WORK
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {['Font.mdx', 'nextstepengineer.mdx', 'unkey.mdx', 'alterego.mdx', 'tailwindcss.mdx'].map((mdx) => (
              <div key={mdx} className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-600 dark:bg-gray-800">
                <span className="font-google-sans-code text-sm font-medium text-blue-900 dark:text-blue-100">
                  {mdx}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

// Error Boundary Component for safely rendering components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; componentName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center text-center text-red-600 dark:text-red-400">
          <div>
            <p className="font-google-sans-code text-xs">⚠️ Error</p>
            <p className="font-google-sans-code text-xs">Check props</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default UnpppPage;

