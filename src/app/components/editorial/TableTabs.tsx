'use client';

import React, { useState } from 'react';
import KeywordWrapper from '../KeywordWrapper';
import SleekTabs from '../SleekTabs';
import { parseMarkdownText } from '../../utils/textParsing';

// A cell's markdown as plain text, short enough to name a tab
const plain = (cell: string) =>
  cell
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`]/g, '')
    .trim();

/**
 * A `table` section on phones: one tab per row, named by its first cell,
 * behind the house tab bar (SleekTabs). The active row reads as label /
 * value lines (each column's header over its cell), with no card around
 * them, instead of every row stacked as a bordered card. A one-row table
 * skips the tab bar.
 */
const TableTabs: React.FC<{ headers: string[]; rows: string[][]; accent: string }> = ({ headers, rows, accent }) => {
  const [active, setActive] = useState('0');
  const index = Math.min(Number(active), rows.length - 1);
  const row = rows[index] ?? [];

  return (
    <div>
      {rows.length > 1 && (
        <SleekTabs
          label="Table rows"
          tabs={rows.map((r, i) => ({ id: String(i), label: plain(r[0] ?? '') || `Row ${i + 1}` }))}
          activeId={String(index)}
          onChange={setActive}
          accent={accent}
          className="mb-4"
        />
      )}
      <dl key={index} className="animate-in fade-in space-y-3 duration-200">
        {row.map((cell, cellIndex) => (
          <div key={cellIndex}>
            {headers[cellIndex] && (
              <dt>
                <KeywordWrapper
                  className="font-google-sans-code text-xs uppercase tracking-wide text-[var(--text-muted)]"
                  html={parseMarkdownText(headers[cellIndex])}
                />
              </dt>
            )}
            <dd>
              <KeywordWrapper
                className="mt-0.5 block font-space-grotesk text-sm leading-relaxed text-[var(--foreground)]"
                html={parseMarkdownText(cell)}
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default TableTabs;
