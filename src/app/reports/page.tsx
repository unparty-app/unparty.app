import { existsSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';
import { generatePageMetadata } from '../utils/ogMetadata';
import ReportGallery from '../components/ReportGallery';
import { HTML_REPORTS } from '../constants/htmlReports';
import { SITE_TITLE } from '../constants/organization';

export const metadata: Metadata = generatePageMetadata({
  title: `REPORTS | ${SITE_TITLE}`,
  description: `Generated artifacts from ${SITE_TITLE} including reports, dashboards, sprint docs, brand colors, repo metadata, and various analytics to answer all of your EFFORT questions.`,
  category: 'BUILD',
  coverId: 'cover-003',
  path: '/reports',
});

// Only the reports this copy has in public/: the list names unparty's, and a
// copy ships some of them
const reports = HTML_REPORTS.filter((report) => existsSync(join(process.cwd(), 'public', `${report.filename}.html`)));

const ReportsPage = () => {
  return (
    <main className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col gap-6">
        <ReportGallery reports={reports} />
      </div>
    </main>
  );
};

export default ReportsPage;
