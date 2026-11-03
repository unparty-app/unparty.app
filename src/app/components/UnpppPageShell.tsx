import clsx from 'clsx';
import type { ReactNode } from 'react';

interface UnpppPageShellProps {
  children: ReactNode;
  className?: string;
}

export default function UnpppPageShell({ children, className }: UnpppPageShellProps) {
  return (
    <main className={clsx('unppp-page-shell mx-auto w-full max-w-5xl', className)}>
      {children}
    </main>
  );
}
