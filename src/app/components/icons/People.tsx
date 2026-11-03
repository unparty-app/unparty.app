'use client';

import HandDrawnIcon, { type HandDrawnIconProps } from './HandDrawnIcon';
import { LOOP } from './shapes';

// People (#1391): a head drawn as a loop that runs past its start, and
// shoulders as one arc. Users is a smaller person with a second behind.

export function User(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="User">
      <path d="M12.2 3.9c-2.2-.1-3.9 1.6-3.9 3.8 0 2.1 1.7 3.9 3.8 3.9 2.2 0 3.9-1.7 3.9-3.9 0-2.1-1.5-3.6-3.4-3.9" />
      <path d="M4.6 20.3c.5-3.6 3.6-6.2 7.4-6.2 3.9 0 7 2.6 7.5 6.4" />
    </HandDrawnIcon>
  );
}

export function Users(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Users">
      <path d="M9.1 4.4c-2-.1-3.6 1.5-3.6 3.5s1.6 3.6 3.5 3.6 3.6-1.6 3.6-3.6c0-1.9-1.4-3.3-3.2-3.6" />
      <path d="M2.7 20c.4-3.3 3.2-5.6 6.5-5.6 3.4 0 6.1 2.4 6.6 5.7" />
      <path d="M15.7 4.8c1.6.3 2.8 1.7 2.8 3.4 0 1.6-1.1 3-2.6 3.4" />
      <path d="M17.7 14.7c2.1.6 3.6 2.6 3.8 5.2" />
    </HandDrawnIcon>
  );
}

export function Bot(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Bot">
      <path d="M5.1 8.1c4.6-.1 9.2-.1 13.8 0 1 0 1.8.8 1.8 1.8.1 3.1.1 6.2 0 9.3 0 1-.8 1.8-1.8 1.8-4.6.1-9.2.1-13.8 0-1 0-1.8-.8-1.8-1.8-.1-3.1-.1-6.2 0-9.3 0-1 .8-1.8 1.8-1.8" />
      <path d="M12.1 8c-.1-1.3 0-2.7 0-4" />
      <path d="M8.1 4c2.6-.1 5.2-.1 7.8 0" />
      <path d="M2 14.1c.7-.1 1.3 0 2 0" />
      <path d="M20 14c.7 0 1.4-.1 2 0" />
      <path d="M9.1 13.1c0 .6-.1 1.3 0 1.9" />
      <path d="M15 13c.1.7.1 1.4 0 2" />
    </HandDrawnIcon>
  );
}

export function Heart(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Heart">
      <path d="M12 20.6c-2.8-2.4-5.6-4.8-8-7.6-1.6-1.9-2-4.6-.8-6.8 1.4-2.4 4.4-3.4 6.9-2.3.8.4 1.4.9 1.9 1.6.5-.7 1.1-1.3 1.9-1.6 2.5-1.1 5.5-.2 6.9 2.3 1.2 2.2.8 4.9-.8 6.8-2.5 2.8-5.2 5.2-8 7.6" />
    </HandDrawnIcon>
  );
}

// ThumbsDown is the same hand, upside down
function ThumbsUpStrokes() {
  return (
    <>
      <path d="M7.1 10.1c-.1 3.9-.1 7.9 0 11.8" />
      <path d="M15.1 5.9c-.3 1-.6 1.9-.9 2.9 1.9-.1 3.9-.1 5.8 0 1.3 0 2.2 1.3 1.9 2.5-.6 2.6-1.3 5.2-2 7.8-.3.9-1.1 1.6-2.1 1.6-4.4.1-8.9.1-13.3 0-1.1 0-2-.9-2-2-.1-2.6-.1-5.3 0-7.9 0-1.1.9-2 2-2 .9 0 1.9-.1 2.8 0 1.4 0 2.6-.8 3.2-2.1.8-1.6 1.5-3.2 2.3-4.8 1.6 0 2.8 1.6 2.3 3.2" />
    </>
  );
}

export function ThumbsUp(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="ThumbsUp">
      <ThumbsUpStrokes />
    </HandDrawnIcon>
  );
}

// ThumbsUp, upside down
export function ThumbsDown(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="ThumbsDown">
      <g transform="matrix(1 0 0 -1 0 24)">
        <ThumbsUpStrokes />
      </g>
    </HandDrawnIcon>
  );
}

export function Brain(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Brain">
      <path d="M12.1 5.1c0-1.8-1.5-3.1-3.2-3-1.8.1-3 1.5-3.1 3.2-1.9.6-3 2.6-2.5 4.5-1.3 1.2-1.6 3.1-.8 4.7-.6 1.9.4 3.9 2.3 4.6.5 1.9 2.4 3 4.3 2.6 1.6-.3 2.9-1.6 3-3.3.1-4.5.1-8.9 0-13.3" />
      <path d="M11.9 5.1c0-1.8 1.5-3.1 3.2-3 1.8.1 3 1.5 3.1 3.2 1.9.6 3 2.6 2.5 4.5 1.3 1.2 1.6 3.1.8 4.7.6 1.9-.4 3.9-2.3 4.6-.5 1.9-2.4 3-4.3 2.6-1.6-.3-2.9-1.6-3-3.3" />
    </HandDrawnIcon>
  );
}

export function Sparkles(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Sparkles">
      <path d="M9.9 15.4c-.2-.7-.8-1.3-1.5-1.5-2-.5-4-1-6-1.5 2-.6 4-1.1 6-1.6.7-.2 1.3-.8 1.5-1.5.5-2 1-4 1.6-6 .5 2 1 4 1.5 6 .2.7.8 1.3 1.5 1.5 2 .5 4 1 6 1.6-2 .5-4 1-6 1.5-.7.2-1.3.8-1.5 1.5-.5 2-1 4-1.5 6-.6-2-1.1-4-1.6-6" />
      <path d="M19.9 2.1c0 1.3-.1 2.6 0 3.9" />
      <path d="M18 4c1.3.1 2.6.1 3.9 0" />
      <path d="M4.1 17c0 .7-.1 1.4 0 2" />
      <path d="M3.1 18c.7.1 1.4.1 2 0" />
    </HandDrawnIcon>
  );
}

export function PartyPopper(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="PartyPopper">
      <path d="M5.8 11.3c-1.2 3.3-2.3 6.5-3.4 9.8-.1.3.2.6.5.5 3.3-1.1 6.5-2.3 9.8-3.4" />
      <path d="M5.8 11.3c2.3 2.3 4.6 4.6 6.9 6.9" />
      <path d="M14.1 2.9c-.2 1.2-.6 2.3-1.2 3.3" />
      <path d="M21.1 9.9c-1.2.2-2.3.6-3.3 1.2" />
      <path d="M17.1 3.1c-.6 2.2-1.9 4.1-3.6 5.6" />
      <path d="M20.9 7c-2.2.6-4.1 1.9-5.6 3.6" />
      <path d="M9.1 3.1h.1" />
      <path d="M20.9 14.9h.1" />
    </HandDrawnIcon>
  );
}

export function Award(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Award">
      <path d="M12.1 2.4c-3.3-.1-6 2.6-6 5.9 0 3.3 2.7 6 6 6s6-2.7 6-6c0-3.1-2.4-5.6-5.4-5.9" />
      <path d="M8.3 12.9c-.4 2.9-.9 5.8-1.3 8.7 1.7-1 3.4-2 5-3 1.7 1 3.3 2 5 3-.4-2.9-.8-5.8-1.3-8.7" />
    </HandDrawnIcon>
  );
}

export function Trophy(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Trophy">
      <path d="M7.1 3.2c3.3-.1 6.6-.1 9.8 0 .1 2.3.1 4.6 0 6.9-.1 2.7-2.3 4.9-4.9 4.9s-4.9-2.2-4.9-4.9c-.1-2.3-.1-4.6 0-6.9" />
      <path d="M7.1 5.1c-1.2 0-2.3-.1-3.5 0-.1 1.6.6 3.1 1.9 4 .5.3 1 .5 1.6.6" />
      <path d="M16.9 5.1c1.2 0 2.3-.1 3.5 0 .1 1.6-.6 3.1-1.9 4-.5.3-1 .5-1.6.6" />
      <path d="M10.1 14.7c0 1.6-.1 3.2-.1 4.8" />
      <path d="M14 14.7c.1 1.6.1 3.2 0 4.8" />
      <path d="M6.1 21c3.9.1 7.9.1 11.8 0" />
    </HandDrawnIcon>
  );
}

export function Target(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Target">
      <path d={LOOP} />
      <path d="M12.1 7.9c-2.3-.1-4.1 1.8-4.1 4.1 0 2.2 1.8 4.1 4 4.1 2.3 0 4.1-1.8 4.1-4 0-2.1-1.6-3.9-3.7-4.1" />
      <path d="M12 11.9h.1" />
    </HandDrawnIcon>
  );
}

export function GraduationCap(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="GraduationCap">
      <path d="M21.4 10.9c.4-.2.4-.8 0-1-3.1-1.4-6.2-2.8-9.3-4.3-.4-.2-.9-.2-1.3 0-3.1 1.4-6.2 2.8-9.3 4.3-.4.2-.4.8 0 1 3.1 1.4 6.2 2.8 9.3 4.3.4.2.9.2 1.3 0 3.1-1.4 6.2-2.9 9.3-4.3" />
      <path d="M22 10.1c0 2-.1 4 0 6" />
      <path d="M6.1 12.6c0 1.2-.1 2.4 0 3.5 0 1.7 2.7 3 6 3s6-1.3 6-3c.1-1.2.1-2.3 0-3.5" />
    </HandDrawnIcon>
  );
}
