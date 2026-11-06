'use client';

import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getPortfolio, type PortfolioItem } from '@/lib/component-portfolio';
import { getDependItems } from '@/utils/dependCosts';
import { iconByName } from '../icons/byName';
import RowTable, { type RowColumn } from '../RowTable';

/**
 * ComponentTable - the made components of the portfolio
 * (src/lib/component-portfolio.ts: those with a published article) as the
 * house table (RowTable, #572): each component, what it gives you, and the
 * services it runs on drawn as hand-drawn icons, each row leading to its
 * article.
 *
 * `without` leaves out every component that runs on one of those services
 * (DependConfig.json ids, comma separated): `without=claude` is everything a
 * copy can build with no AI at all. It opens on the ones that need the most,
 * so the stack shows first and what runs on any copy (a check) follows.
 */

const PORTFOLIO = getPortfolio();
const SERVICE_NAME = new Map(getDependItems().map((item) => [item.id, item.name]));

// Each service by what it does, as a hand-drawn icon; one without a mapping shows its name
const SERVICE_ICON: Record<string, string> = {
  github: 'GitBranch',
  neon: 'Database',
  clerk: 'User',
  drains: 'Activity',
  claude: 'Brain',
  vercel: 'Cloud',
  domain: 'Globe',
  polar: 'DollarSign',
  blob: 'Camera',
  loops: 'Mail',
  slack: 'MessageSquare',
  search: 'Search',
};
// Looked up once, not during render
const CHECK_ICON = iconByName('Check');
const SERVICE_ICONS = Object.fromEntries(Object.entries(SERVICE_ICON).map(([id, name]) => [id, iconByName(name)]));

function Stack({ needs, color }: { needs: string[]; color: string }) {
  if (needs.length === 0) {
    return (
      <span className="inline-flex" role="img" aria-label="runs on any copy" title="runs on any copy">
        {CHECK_ICON ? <CHECK_ICON size={18} color={color} /> : '—'}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {needs.map((id) => {
        const name = SERVICE_NAME.get(id) ?? id;
        const Icon = SERVICE_ICONS[id];
        return Icon ? (
          <span key={id} className="inline-flex" role="img" aria-label={name} title={name}>
            <Icon size={18} />
          </span>
        ) : (
          <span key={id} className="font-google-sans-code text-[10px] uppercase tracking-wide">{name}</span>
        );
      })}
    </span>
  );
}

export default function ComponentTable({ without }: { without?: string }) {
  const { colorValue } = useTheme();

  const rows = useMemo(() => {
    const left = new Set((without ?? '').split(/[\s,|]+/).filter(Boolean));
    return PORTFOLIO.filter((item) => item.done && !item.needs.some((id) => left.has(id)));
  }, [without]);

  const columns: RowColumn<PortfolioItem>[] = [
    {
      id: 'stack',
      label: 'stack',
      value: (item) => <Stack needs={item.needs} color={colorValue} />,
      sort: (item) => item.needs.length,
    },
  ];

  return (
    <RowTable
      rows={rows}
      rowKey={(item) => item.name}
      label="component"
      name={(item) => item.label}
      nameSort={(item) => item.label.toLowerCase()}
      meta={(item) => item.home?.blurb}
      circle={(item) => ({ text: item.label })}
      columns={columns}
      sort={{ by: 'stack', dir: 'desc' }}
      href={(item) => (item.home ? `/article/${item.home.slug}` : undefined)}
      search={(item, query) => `${item.label} ${item.home?.blurb ?? ''}`.toLowerCase().includes(query.toLowerCase())}
      searchLabel="find a component"
      empty="no components match."
    />
  );
}
