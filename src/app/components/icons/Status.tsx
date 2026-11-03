'use client';

import HandDrawnIcon, { type HandDrawnIconProps } from './HandDrawnIcon';
import { LOOP } from './shapes';

// Status and seeing (#1391): the circled marks sit in the same loop as the
// navigation arrows.

export function AlertCircle(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="AlertCircle">
      <path d={LOOP} />
      <path d="M12.1 7.4c0 2-.1 3.9 0 5.9" />
      <path d="M12 16.6h.1" />
    </HandDrawnIcon>
  );
}

export function Info(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Info">
      <path d={LOOP} />
      <path d="M12 11.1c0 1.9-.1 3.8 0 5.7" />
      <path d="M12.1 7.6h.1" />
    </HandDrawnIcon>
  );
}

export function Eye(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Eye">
      <path d="M2.4 12.1c2.3-4.2 5.8-6.4 9.6-6.4 3.9 0 7.4 2.3 9.7 6.4-2.3 4-5.8 6.2-9.7 6.2-3.8 0-7.3-2.1-9.6-6.2" />
      <path d="M12.2 9.1c-1.7-.1-3 1.3-3 2.9 0 1.7 1.3 3 3 3s3-1.4 3-3c0-1.5-1.1-2.7-2.6-2.9" />
    </HandDrawnIcon>
  );
}

export function Circle(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Circle">
      <path d={LOOP} />
    </HandDrawnIcon>
  );
}

// The check runs out past the loop (lucide's circle-check-big)
export function CheckCircle(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="CheckCircle">
      <path d={LOOP} />
      <path d="M8 11.4c1.2 1.1 2.3 2.4 3.3 3.8 2.9-4.4 6.1-8.1 10-11.2" />
    </HandDrawnIcon>
  );
}

// The check stays inside the loop
export function CheckCircle2(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="CheckCircle2">
      <path d={LOOP} />
      <path d="M8 12.3c1.1 1 2.1 2.1 3.1 3.3 1.6-2.6 3.3-4.9 5.3-7" />
    </HandDrawnIcon>
  );
}

export function XCircle(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="XCircle">
      <path d={LOOP} />
      <path d="M9.1 8.9c2 2 3.9 4.1 5.9 6.2" />
      <path d="M15.1 8.8c-2.1 2-4.1 4.1-6 6.3" />
    </HandDrawnIcon>
  );
}

export function HelpCircle(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="HelpCircle">
      <path d={LOOP} />
      <path d="M9.3 9.2c.4-1.4 1.6-2.3 3-2.3 1.6 0 2.9 1.2 2.9 2.6 0 2-2.9 2.6-3 4.4" />
      <path d="M12.2 17.1h.1" />
    </HandDrawnIcon>
  );
}

export function AlertTriangle(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="AlertTriangle">
      <path d="M10.6 4.1c-2.7 4.6-5.4 9.2-8 13.9-.6 1.1.2 2.4 1.4 2.4 5.4.1 10.7.1 16.1 0 1.2 0 2-1.3 1.4-2.4-2.7-4.7-5.4-9.3-8.1-13.9-.6-1-2.2-1-2.8 0" />
      <path d="M12.1 9.3c0 1.4-.1 2.8 0 4.2" />
      <path d="M12 16.9h.1" />
    </HandDrawnIcon>
  );
}

export function Lock(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Lock">
      <path d="M7.1 11c-.1-1.4 0-2.7 0-4.1 0-2.7 2.2-4.9 4.9-4.9 2.7 0 4.9 2.2 4.9 4.9.1 1.4.1 2.7 0 4.1" />
      <path d="M5.1 11.1c4.6-.1 9.2-.1 13.8 0 1 0 1.8.8 1.8 1.8.1 2.4.1 4.8 0 7.2 0 1-.8 1.8-1.8 1.8-4.6.1-9.2.1-13.8 0-1 0-1.8-.8-1.8-1.8-.1-2.4-.1-4.8 0-7.2 0-1 .8-1.8 1.8-1.8" />
    </HandDrawnIcon>
  );
}

export function KeyRound(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="KeyRound">
      <path d="M2.9 17.2c-.3.4-.5.9-.5 1.4 0 .8-.1 1.6 0 2.4 0 .5.5 1 1 1 1-.1 2-.1 3 0 .5 0 1-.4 1-1v-1c0-.6.4-1 1-1h1c.6 0 1-.4 1-1v-1c0-.6.4-1 1-1 .6 0 1.1-.2 1.5-.6.3-.3.5-.5.8-.8 3.3 1.5 7.2-.1 8.6-3.4 1.4-3.3-.1-7.1-3.4-8.6-3.3-1.4-7.1.1-8.6 3.4-.7 1.6-.7 3.5 0 5.1-1.7 1.8-3.5 3.5-5.2 5.2" />
      <path d="M16.6 7.4h.1" />
    </HandDrawnIcon>
  );
}

export function Shield(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Shield">
      <path d="M20.1 13c0 5-3.5 7.5-7.7 9-.2.1-.5.1-.7 0-4.2-1.5-7.7-4-7.7-9-.1-2.3-.1-4.7 0-7 0-.6.4-1 1-1 2 0 4.5-1.2 6.2-2.7.4-.4 1.1-.4 1.5 0 1.8 1.5 4.2 2.7 6.2 2.7.6 0 1 .4 1 1 .3 2.3.3 4.7.2 7" />
    </HandDrawnIcon>
  );
}

export function ShieldCheck(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="ShieldCheck">
      <path d="M20.1 13c0 5-3.5 7.5-7.7 9-.2.1-.5.1-.7 0-4.2-1.5-7.7-4-7.7-9-.1-2.3-.1-4.7 0-7 0-.6.4-1 1-1 2 0 4.5-1.2 6.2-2.7.4-.4 1.1-.4 1.5 0 1.8 1.5 4.2 2.7 6.2 2.7.6 0 1 .4 1 1 .3 2.3.3 4.7.2 7" />
      <path d="M8.9 12.1c.8.7 1.6 1.4 2.3 2.3 1.4-1.7 2.9-3.2 4.5-4.6" />
    </HandDrawnIcon>
  );
}

export function EyeOff(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="EyeOff">
      <path d="M2.4 12.1c2.3-4.2 5.8-6.4 9.6-6.4 3.9 0 7.4 2.3 9.7 6.4-2.3 4-5.8 6.2-9.7 6.2-3.8 0-7.3-2.1-9.6-6.2" />
      <path d="M12.2 9.1c-1.7-.1-3 1.3-3 2.9 0 1.7 1.3 3 3 3s3-1.4 3-3c0-1.5-1.1-2.7-2.6-2.9" />
      <path d="M3.1 3.1c6 5.9 11.9 11.9 17.8 17.8" />
    </HandDrawnIcon>
  );
}

// lucide exports Lock twice (Lock and LockIcon); one drawing
export const LockIcon = Lock;
