'use client';

import HandDrawnIcon, { type HandDrawnIconProps } from './HandDrawnIcon';

// Git (#1391): branches and commits, as small pen loops and lines.

export function GitBranch(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="GitBranch">
      <path d="M6.1 3.1c-.1 4-.1 8 0 12" />
      <path d="M6.1 15.1c-1.7-.1-3 1.2-3 2.9s1.3 3 2.9 3 3-1.3 3-3c0-1.6-1.2-2.8-2.7-2.9" />
      <path d="M18.1 3.1c-1.7-.1-3 1.2-3 2.9s1.3 3 2.9 3 3-1.3 3-3c0-1.6-1.2-2.8-2.7-2.9" />
      <path d="M18 9.1c0 5.1-4.1 9-9.1 9" />
    </HandDrawnIcon>
  );
}

export function GitFork(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="GitFork">
      <path d="M6.1 3.1c-1.7-.1-3 1.2-3 2.9s1.3 3 2.9 3 3-1.3 3-3c0-1.6-1.2-2.8-2.7-2.9" />
      <path d="M18.1 3.1c-1.7-.1-3 1.2-3 2.9s1.3 3 2.9 3 3-1.3 3-3c0-1.6-1.2-2.8-2.7-2.9" />
      <path d="M12.1 15.1c-1.7-.1-3 1.2-3 2.9s1.3 3 2.9 3 3-1.3 3-3c0-1.6-1.2-2.8-2.7-2.9" />
      <path d="M6.1 9.1c-.1.7 0 1.3 0 2 0 1.1.9 2 2 2 2.6.1 5.3.1 7.9 0 1.1 0 2-.9 2-2 .1-.7.1-1.3 0-2" />
      <path d="M12 13.1c0 .7-.1 1.3 0 2" />
    </HandDrawnIcon>
  );
}

export function GitCommit(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="GitCommit">
      <path d="M12.1 9.1c-1.7-.1-3 1.3-3 2.9 0 1.7 1.3 3 3 3s3-1.4 3-3c0-1.5-1.1-2.7-2.6-2.9" />
      <path d="M2.9 12.1c2-.1 4.1-.1 6.1 0" />
      <path d="M15 12c2-.1 4.1-.1 6.1 0" />
    </HandDrawnIcon>
  );
}
