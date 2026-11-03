'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import Badge from './Badge';
import type { HtmlReport } from '../constants/htmlReports';

interface ReportGalleryProps {
  reports: HtmlReport[];
}

const ReportModal: React.FC<{
  report: HtmlReport;
  colorValue: string;
  onClose: () => void;
}> = ({ report, colorValue, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--background)' }}
      role="dialog"
      aria-modal="true"
      aria-label={report.title}
    >
      <div
        className="animate-in fade-in slide-in-from-bottom-4 vh-card-elevated relative flex w-full max-w-5xl flex-col overflow-hidden rounded-xl border duration-200"
        style={{ borderColor: `${colorValue}40`, backgroundColor: 'var(--background)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: `${colorValue}30` }}>
          <div className="flex items-center gap-3">
            <h2 className="font-vt323 text-lg uppercase" style={{ color: colorValue }}>
              {report.title}
            </h2>
            <Badge variant="header" size="sm">{report.source}</Badge>
          </div>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--background-highlight)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close report modal"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Points at the raw static asset in public/, not the /html/[filename]
            app route — that route renders inside the site's root layout, so
            loading it here would nest the whole app's chrome inside the modal.
            embedPath overrides this for reports that are bare fragments
            relying on the app's own styling rather than standalone documents. */}
        <iframe
          src={report.embedPath ?? `/${report.filename}.html`}
          title={report.title}
          className="h-[70vh] w-full border-0"
          sandbox="allow-scripts"
        />
      </div>

      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />
    </div>,
    document.body
  );
};

const ReportGallery: React.FC<ReportGalleryProps> = ({ reports }) => {
  const { colorValue } = useTheme();
  const [openReport, setOpenReport] = useState<HtmlReport | null>(null);

  if (reports.length === 0) return null;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2 px-4">
        <div className="size-2 rounded-full" style={{ backgroundColor: colorValue }} />
        <span className="font-vt323 text-xs font-bold uppercase tracking-widest" style={{ color: colorValue }}>
          REPORTS.
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {reports.map((report) => (
          <button
            key={report.filename}
            type="button"
            onClick={() => setOpenReport(report)}
            aria-label={`Open report: ${report.title}`}
            className="w-[280px] shrink-0 snap-start rounded-lg border p-4 text-left transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--background)', borderColor: `${colorValue}66` }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-vt323 text-base uppercase leading-tight tracking-wide" style={{ color: colorValue }}>
                {report.title}
              </p>
              <Badge variant="secondary" size="sm">{report.source}</Badge>
            </div>
            <p className="mt-3 font-google-sans-code text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              {report.description}
            </p>
          </button>
        ))}
      </div>

      {openReport && (
        <ReportModal report={openReport} colorValue={colorValue} onClose={() => setOpenReport(null)} />
      )}
    </div>
  );
};

export default ReportGallery;
