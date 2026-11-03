'use client';

import React from 'react';

export interface SleekTab {
  id: string;
  label: React.ReactNode;
}

/**
 * The house tab bar, from RepoStats' TabbedMetricTable: small uppercase labels,
 * the active one in foreground with an accent underline, a hairline under the
 * whole bar, horizontal scroll when the tabs outgrow it. No boxes, no pills.
 *
 * Used where a set of rows would otherwise stack down a phone screen
 * (challenge steps, the SETUP. curriculum's chapters, table rows): the caller
 * renders only the active tab's content under it.
 */
const SleekTabs: React.FC<{
  tabs: SleekTab[];
  activeId: string;
  onChange: (id: string) => void;
  accent: string;
  className?: string;
  label?: string;
}> = ({ tabs, activeId, onChange, accent, className = '', label }) => (
  <div
    role="tablist"
    aria-label={label}
    className={`flex items-center gap-4 overflow-x-auto whitespace-nowrap border-b scrollbar-hide ${className}`}
    style={{ borderColor: `${accent}25` }}
  >
    {tabs.map((tab) => {
      const isActive = tab.id === activeId;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(tab.id)}
          className="relative -mb-px inline-flex max-w-[11rem] shrink-0 items-center gap-2 py-3 font-google-sans-code text-xs uppercase tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--foreground)]"
          style={{ color: isActive ? 'var(--foreground)' : 'var(--text-muted)' }}
        >
          <span className="truncate">{tab.label}</span>
          <span
            className="absolute inset-x-0 bottom-0 h-0.5 transition-opacity duration-200"
            style={{ backgroundColor: accent, opacity: isActive ? 1 : 0 }}
          />
        </button>
      );
    })}
  </div>
);

export default SleekTabs;
