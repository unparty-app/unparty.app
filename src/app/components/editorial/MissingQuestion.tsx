'use client';

import Link from 'next/link';
import { useUser } from '@/lib/auth-stub.client';
import { useTheme } from '@/app/contexts/ThemeContext';

/**
 * An article's question that this site's database doesn't have, or can't
 * reach. Questions live in each copy's own database and no seed makes them,
 * so a copy starts without the ones its articles name. A visitor sees
 * nothing, and the page reads on (EditorialSection hides the empty band). The
 * owner sees one line saying why, and where to add it.
 */
export default function MissingQuestion({ questionId, reason }: { questionId: string; reason: string }) {
  const { user } = useUser();
  const { colorValue } = useTheme();
  if (user?.publicMetadata?.role !== 'admin') return null;
  return (
    <p className="font-google-sans-code text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
      only you see this: the question <span style={{ color: colorValue }}>{questionId}</span> {reason}.{' '}
      <Link href="/admin/questions" style={{ color: colorValue }}>
        your questions →
      </Link>
    </p>
  );
}
