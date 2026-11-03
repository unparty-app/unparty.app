'use client';

import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ICON_DEFAULTS } from '../../constants/organization';
import { DRAWABLE_ICONS } from './drawable';
import { iconByName } from './byName';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';

type Role = 'poem' | 'category';

// The roles a default icon plays, and what stands in before the owner picks
const ROLES: { role: Role; title: string; detail: string; fallback: string | null }[] = [
  { role: 'poem', title: 'Poem', detail: 'walks every poem through its story, unless the poem names its own', fallback: 'Poem' },
  { role: 'category', title: 'Category', detail: 'stands in the dock for an article whose category is an emoji', fallback: null },
];

type Saved = { applied: 'now' } | { applied: 'after-deploy'; prUrl: string };

/**
 * Pick your defaults (#589): the hand-drawn icon each role uses, picked from
 * the icons the pad can redraw (drawable.ts), so drawing over one on the pad
 * ("Your icons") makes the default the owner's own hand too. Saved to
 * FoundersConfig iconDefaults through the config writer, like brand colors
 */
export default function IconDefaults() {
  const { colorValue } = useTheme();
  const [defaults, setDefaults] = useState<Partial<Record<Role, string>>>(ICON_DEFAULTS);
  const [open, setOpen] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (role: Role, name: string) => {
    const next = { ...defaults, [role]: name };
    setDefaults(next);
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const r = await fetch('/api/admin/icon-defaults', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ defaults: next }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.line ? `${d.error}: ${d.line}` : d.error);
      setSaved(d);
      setOpen(null);
    } catch (e) {
      setDefaults(defaults);
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {ROLES.map(({ role, title, detail, fallback }) => {
        const name = defaults[role] ?? fallback;
        const Icon = iconByName(name ?? undefined);
        const expanded = open === role;
        return (
          <div key={role}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : role)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3 rounded-lg py-2 text-left transition-colors hover:bg-[var(--background-highlight)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: `${colorValue}55` }}>
                {Icon ? <Icon size={24} themed /> : <span className={LABEL}>—</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-space-grotesk text-sm text-[var(--foreground)]">{title}</span>
                <span className="block font-space-grotesk text-xs text-[var(--text-muted)]">{detail}</span>
              </span>
              <span className={LABEL}>{defaults[role] ?? (fallback ? `${fallback}, until you pick` : 'not yet')}</span>
            </button>
            {expanded && (
              <div className="mt-2 rounded-xl border p-3" style={{ borderColor: `${colorValue}30` }}>
                <p className={`${LABEL} mb-3`}>pick one. to draw your own, redraw it in your icons above.</p>
                <ul className="grid max-h-64 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-10" aria-label={`Icons for ${title}`}>
                  {DRAWABLE_ICONS.map((icon) => {
                    const Choice = iconByName(icon);
                    if (!Choice) return null;
                    const chosen = defaults[role] === icon;
                    return (
                      <li key={icon}>
                        <button
                          type="button"
                          onClick={() => pick(role, icon)}
                          disabled={saving}
                          aria-pressed={chosen}
                          aria-label={icon}
                          title={icon}
                          className="flex size-10 items-center justify-center rounded-full transition-transform hover:scale-110 disabled:opacity-50 motion-reduce:transition-none"
                          style={chosen ? { backgroundColor: colorValue, color: 'var(--background)' } : { color: 'var(--foreground)' }}
                        >
                          <Choice size={20} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
      <p className="font-space-grotesk text-xs text-[var(--text-muted)]" aria-live="polite">
        {error ? (
          <span style={{ color: colorValue }}>{error}</span>
        ) : saved?.applied === 'now' ? (
          'saved. it’s in your copy now.'
        ) : saved?.applied === 'after-deploy' ? (
          <>
            saved. live once{' '}
            <a href={saved.prUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: colorValue }}>
              the change
            </a>{' '}
            deploys.
          </>
        ) : saving ? (
          'saving…'
        ) : null}
      </p>
    </div>
  );
}
