'use client';

import HandDrawnIcon, { type HandDrawnIconProps } from './HandDrawnIcon';
import { LOOP } from './shapes';

// Things (#1391): books, pages, a phone, a bulb. Outlines bow a little and
// their corners don't quite square up.

export function BookOpen(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="BookOpen">
      <path d="M12 6.9C9.8 5.3 6.7 4.6 3.1 4.9c-.1 4.4-.1 8.8 0 13.2 3.5-.2 6.5.4 8.9 2" />
      <path d="M12 6.9c2.3-1.6 5.4-2.3 8.9-2 .1 4.4.1 8.8 0 13.2-3.5-.2-6.5.4-8.9 2" />
      <path d="M12 6.9c-.1 4.4 0 8.8 0 13.2" />
    </HandDrawnIcon>
  );
}

// A quill: what carries a poem through a story (PoemWalker) until someone
// taps it. Redraw it on the icon pad to make every poem's default yours
export function Poem(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Poem">
      <path d="M5.4 18.6C7.2 12.4 11.6 6.3 19.8 3.9c.5 4.8-2.2 9.7-7.4 12.3-2.1 1.1-4.4 1.7-7 2.4" />
      <path d="M3.9 20.3c3.7-4.2 7.5-8 11.8-11.5" />
      <path d="M10.6 12.9c1.3.3 2.7.2 4-.3" />
    </HandDrawnIcon>
  );
}

export function FileText(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="FileText">
      <path d="M14.2 2.9c-2.6-.1-5.1 0-7.6 0-1 0-1.7.8-1.7 1.8-.1 4.9 0 9.9 0 14.8 0 1 .8 1.7 1.8 1.7 3.5.1 7.1.1 10.6 0 1 0 1.8-.8 1.8-1.8.1-4 .1-7.9 0-11.8" />
      <path d="M14.2 2.9c.1 1.5 0 3.1.1 4.6 1.5.1 3 .1 4.6.1-1.5-1.6-3.1-3.2-4.7-4.7" />
      <path d="M8.6 12.6c2.3-.1 4.6-.1 6.9.1" />
      <path d="M8.5 16.4c2.4.1 4.7 0 7-.1" />
    </HandDrawnIcon>
  );
}

export function MessageSquare(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="MessageSquare">
      <path d="M20.9 14.6c0 1.1-.9 1.9-2 1.9-3.8-.1-7.6 0-11.4 0-1.4 1.3-2.8 2.7-4.2 4.1-.1-5.2-.1-10.4 0-15.5 0-1.1.9-2 2-2 4.6-.1 9.1-.1 13.7 0 1.1 0 2 .9 2 2-.1 3.2-.1 6.3-.1 9.5" />
    </HandDrawnIcon>
  );
}

export function Smartphone(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Smartphone">
      <path d="M8.1 2.4c2.6-.1 5.2-.1 7.8 0 1.2 0 2.1.9 2.1 2.1.1 5 .1 10.1 0 15.1 0 1.2-.9 2.1-2.1 2.1-2.6.1-5.2.1-7.8 0-1.2 0-2.1-1-2.1-2.1-.1-5-.1-10.1 0-15.1 0-1.2.9-2.1 2.1-2.1" />
      <path d="M11.5 18c.4-.1.7 0 1.1 0" />
    </HandDrawnIcon>
  );
}

export function Layers(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Layers">
      <path d="M12.2 2.8c-3.2 1.6-6.4 3.1-9.5 4.8 3.1 1.6 6.3 3.2 9.4 4.7 3.2-1.5 6.3-3.1 9.4-4.7-3.1-1.6-6.2-3.2-9.3-4.8" />
      <path d="M2.8 12.2c3.1 1.6 6.2 3.1 9.3 4.7 3.1-1.5 6.2-3.1 9.3-4.7" />
      <path d="M2.9 16.8c3.1 1.6 6.2 3.2 9.3 4.7 3.1-1.5 6.1-3.1 9.2-4.6" />
    </HandDrawnIcon>
  );
}

export function Lightbulb(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Lightbulb">
      <path d="M9.2 17.6c-.1-1.6-.8-2.8-1.9-4C6 12.2 5.4 10.6 5.6 8.8c.4-3.3 3.1-5.8 6.4-5.8 3.6 0 6.4 2.8 6.4 6.3 0 1.8-.7 3.3-1.9 4.5-1 1-1.6 2.3-1.7 3.9" />
      <path d="M9.3 18.2c1.8.1 3.6.1 5.4-.1" />
      <path d="M10.1 21.1c1.3.1 2.6 0 3.8-.1" />
    </HandDrawnIcon>
  );
}

export function Book(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Book">
      <path d="M4.3 19.4c-.1-4.9-.1-9.8 0-14.7 0-1.2 1-2.2 2.2-2.2 4.4-.1 8.9-.1 13.3 0 .1 5.7.1 11.3 0 17-4.4.1-8.9.1-13.3 0-1.2 0-2.2-.9-2.2-2.1 0-1.2 1-2.2 2.2-2.2 4.4-.1 8.9-.1 13.3 0" />
    </HandDrawnIcon>
  );
}

export function Mail(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Mail">
      <path d="M4.2 4.9c5.2-.1 10.4-.1 15.6 0 1 0 1.8.8 1.8 1.8.1 3.6.1 7.2 0 10.7 0 1-.8 1.8-1.8 1.8-5.2.1-10.4.1-15.6 0-1-.1-1.8-.8-1.8-1.8-.1-3.6-.1-7.2 0-10.7 0-1 .8-1.8 1.8-1.8" />
      <path d="M2.6 6.9c3.1 2.1 6.2 4.1 9.4 6.1 3.1-2 6.2-4.1 9.3-6.1" />
    </HandDrawnIcon>
  );
}

export function MessageCircle(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="MessageCircle">
      <path d="M7.8 20.2c1.3.6 2.7.9 4.2.9 5 0 9-3.9 9-8.9.1-5-3.9-9.1-8.9-9.1-5 0-9.1 4-9.1 9 0 1.5.4 2.9 1 4.2-.3 1.6-.7 3.1-1.1 4.7 1.7-.2 3.3-.5 4.9-.8" />
    </HandDrawnIcon>
  );
}

export function Calendar(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Calendar">
      <path d="M5.1 4.6c4.6-.1 9.2-.1 13.8 0 1 0 1.7.8 1.7 1.8.1 4.4.1 8.8 0 13.2 0 1-.8 1.8-1.8 1.8-4.6.1-9.2.1-13.8 0-1 0-1.7-.8-1.7-1.8-.1-4.4-.1-8.8 0-13.2 0-1 .8-1.8 1.8-1.8" />
      <path d="M8.1 2.6c0 1.3-.1 2.6 0 3.9" />
      <path d="M16 2.6c.1 1.3.1 2.6 0 3.9" />
      <path d="M3.6 10.1c5.6.1 11.2.1 16.9-.1" />
    </HandDrawnIcon>
  );
}

export function Clock(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Clock">
      <path d={LOOP} />
      <path d="M12.1 6.9c-.1 1.8 0 3.6 0 5.4 1.2.6 2.4 1.2 3.6 1.9" />
    </HandDrawnIcon>
  );
}

export function List(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="List">
      <path d="M8.4 6.1c4.2-.1 8.4-.1 12.6 0" />
      <path d="M8.3 12.1c4.2.1 8.4.1 12.6-.1" />
      <path d="M8.4 18.1c4.2-.1 8.4 0 12.5 0" />
      <path d="M3.1 6.1h.1" />
      <path d="M3.1 12.1h.1" />
      <path d="M3.1 18.1h.1" />
    </HandDrawnIcon>
  );
}

export function ListChecks(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="ListChecks">
      <path d="M12.9 5.9c2.7-.1 5.4 0 8 0" />
      <path d="M12.9 12.1c2.7.1 5.4.1 8 0" />
      <path d="M12.9 18.1c2.7-.1 5.4 0 8 0" />
      <path d="M3.1 5.6c.6.6 1.2 1.2 1.8 1.9 1.1-1.3 2.2-2.6 3.4-3.8" />
      <path d="M3.1 11.7c.6.6 1.2 1.2 1.8 1.9 1.1-1.3 2.2-2.6 3.4-3.8" />
      <path d="M3.6 18.1h.1" />
    </HandDrawnIcon>
  );
}

export function LayoutDashboard(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="LayoutDashboard">
      <path d="M3.3 3.4c2.1-.1 4.3-.1 6.4 0 .1 2.9.1 5.8 0 8.6-2.1.1-4.3.1-6.4 0-.1-2.9-.1-5.8 0-8.6" />
      <path d="M14.3 3.3c2.1-.1 4.3-.1 6.4 0 .1 1.4.1 2.9 0 4.3-2.1.1-4.3.1-6.4 0-.1-1.4-.1-2.9 0-4.3" />
      <path d="M14.3 12c2.1-.1 4.3-.1 6.4 0 .1 2.9.1 5.8 0 8.6-2.1.1-4.3.1-6.4 0-.1-2.9-.1-5.8 0-8.6" />
      <path d="M3.3 16.4c2.1-.1 4.3-.1 6.4 0 .1 1.4.1 2.9 0 4.3-2.1.1-4.3.1-6.4 0-.1-1.4-.1-2.9 0-4.3" />
    </HandDrawnIcon>
  );
}

export function Grid3x3(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Grid3x3">
      <path d="M5.1 3.4c4.6-.1 9.2-.1 13.8 0 .9 0 1.6.7 1.6 1.6.1 4.6.1 9.3 0 13.9 0 .9-.7 1.6-1.6 1.6-4.6.1-9.2.1-13.8 0-.9 0-1.6-.7-1.6-1.6-.1-4.6-.1-9.3 0-13.9 0-1 .8-1.7 1.9-1.6" />
      <path d="M3.4 9.1c5.7-.1 11.4-.1 17.1 0" />
      <path d="M3.5 15c5.7.1 11.4.1 17.1-.1" />
      <path d="M9.1 3.5c-.1 5.7-.1 11.4 0 17" />
      <path d="M15 3.4c.1 5.7.1 11.4-.1 17.1" />
    </HandDrawnIcon>
  );
}

export function Package(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Package">
      <path d="M11.1 2.9c-2.6 1.3-5.2 2.7-7.8 4.1-.6.3-.9.9-.9 1.5-.1 2.9-.1 5.9 0 8.8 0 .6.4 1.2.9 1.5 2.6 1.4 5.2 2.8 7.8 4.2.6.3 1.3.3 1.8 0 2.6-1.4 5.2-2.8 7.8-4.2.6-.3.9-.9.9-1.5.1-2.9.1-5.9 0-8.8 0-.6-.4-1.2-.9-1.5-2.6-1.4-5.2-2.7-7.8-4.1-.6-.3-1.3-.3-1.8 0" />
      <path d="M2.7 7.4c3.1 1.6 6.2 3.2 9.3 4.7 3.1-1.5 6.2-3.1 9.3-4.7" />
      <path d="M12 12.1c-.1 3.3 0 6.6 0 9.9" />
      <path d="M7.4 4.8c3.1 1.7 6.1 3.4 9.2 5" />
    </HandDrawnIcon>
  );
}

export function Boxes(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Boxes">
      <path d="M8.6 3.4c2.4-.1 4.8-.1 7.1 0 .1 2.4.1 4.7 0 7.1-2.4.1-4.7.1-7.1 0-.1-2.4-.1-4.7 0-7.1" />
      <path d="M3.4 13.4c2.4-.1 4.8-.1 7.1 0 .1 2.4.1 4.7 0 7.1-2.4.1-4.7.1-7.1 0-.1-2.4-.1-4.7 0-7.1" />
      <path d="M13.5 13.4c2.4-.1 4.8-.1 7.1 0 .1 2.4.1 4.7 0 7.1-2.4.1-4.7.1-7.1 0-.1-2.4-.1-4.7 0-7.1" />
    </HandDrawnIcon>
  );
}

export function Database(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Database">
      <path d="M12 2.9c-4.6 0-8.4 1.3-8.4 3s3.8 3 8.4 3 8.4-1.3 8.4-3c0-1.6-3.6-2.9-8.1-3" />
      <path d="M3.6 6c-.1 4-.1 8 0 12 0 1.7 3.8 3 8.4 3s8.4-1.3 8.4-3c.1-4 .1-8 0-12" />
      <path d="M3.6 12.1c0 1.7 3.8 3 8.4 3s8.4-1.3 8.4-3" />
    </HandDrawnIcon>
  );
}

export function Cloud(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Cloud">
      <path d="M17.6 19.1c-2.9.1-5.7.1-8.6 0-3.9 0-7-3.2-7-7 0-3.9 3.2-7 7-7 3.1 0 5.8 2 6.7 5 .6-.1 1.2-.1 1.8 0 2.5 0 4.5 2 4.5 4.5s-2 4.5-4.4 4.5" />
    </HandDrawnIcon>
  );
}

export function CloudCheck(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="CloudCheck">
      <path d="M17.6 19.1c-2.9.1-5.7.1-8.6 0-3.9 0-7-3.2-7-7 0-3.9 3.2-7 7-7 3.1 0 5.8 2 6.7 5 .6-.1 1.2-.1 1.8 0 2.5 0 4.5 2 4.5 4.5s-2 4.5-4.4 4.5" />
      <path d="M8.9 13.3c.9.8 1.8 1.7 2.6 2.7 1.5-1.8 3.1-3.5 4.7-5.1" />
    </HandDrawnIcon>
  );
}

export function AppWindow(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="AppWindow">
      <path d="M4.3 3.9c5.1-.1 10.3-.1 15.4 0 1 0 1.8.8 1.8 1.8.1 4.2.1 8.4 0 12.6 0 1-.8 1.8-1.8 1.8-5.1.1-10.3.1-15.4 0-1 0-1.8-.8-1.8-1.8-.1-4.2-.1-8.4 0-12.6 0-1 .8-1.8 1.8-1.8" />
      <path d="M2.6 8.1c6.3.1 12.6.1 18.9-.1" />
      <path d="M6.1 6h.1" />
      <path d="M9.1 6h.1" />
    </HandDrawnIcon>
  );
}

export function Monitor(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Monitor">
      <path d="M4.2 3.1c5.2-.1 10.4-.1 15.6 0 1 0 1.8.8 1.8 1.8.1 3.4.1 6.8 0 10.2 0 1-.8 1.8-1.8 1.8-5.2.1-10.4.1-15.6 0-1 0-1.8-.8-1.8-1.8-.1-3.4-.1-6.8 0-10.2 0-1 .8-1.8 1.8-1.8" />
      <path d="M12 17c0 1.3-.1 2.6 0 3.9" />
      <path d="M7.9 20.9c2.7.1 5.5.1 8.2 0" />
    </HandDrawnIcon>
  );
}

export function Cpu(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Cpu">
      <path d="M7.2 4.1c3.2-.1 6.4-.1 9.6 0 1.7 0 3.1 1.4 3.1 3.1.1 3.2.1 6.4 0 9.6 0 1.7-1.4 3.1-3.1 3.1-3.2.1-6.4.1-9.6 0-1.7 0-3.1-1.4-3.1-3.1-.1-3.2-.1-6.4 0-9.6 0-1.7 1.4-3.1 3.1-3.1" />
      <path d="M9.1 9.1c1.9-.1 3.9-.1 5.8 0 .1 1.9.1 3.9 0 5.8-1.9.1-3.9.1-5.8 0-.1-1.9-.1-3.9 0-5.8" />
      <path d="M9.1 1.9c0 .7-.1 1.4 0 2.1" />
      <path d="M14.9 1.9c.1.7.1 1.4 0 2.1" />
      <path d="M9.1 20c0 .7-.1 1.4 0 2.1" />
      <path d="M14.9 20c.1.7.1 1.4 0 2.1" />
      <path d="M1.9 9.1c.7 0 1.4-.1 2.1 0" />
      <path d="M1.9 14.9c.7.1 1.4.1 2.1 0" />
      <path d="M20 9.1c.7 0 1.4-.1 2.1 0" />
      <path d="M20 14.9c.7.1 1.4.1 2.1 0" />
    </HandDrawnIcon>
  );
}

export function Code2(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Code2">
      <path d="M17.9 7.1c1.6 1.6 3.3 3.2 4.9 4.9-1.6 1.6-3.3 3.3-4.9 4.9" />
      <path d="M6.1 16.9c-1.6-1.6-3.3-3.2-4.9-4.9 1.6-1.6 3.3-3.3 4.9-4.9" />
      <path d="M14.5 4c-1.6 5.3-3.3 10.7-4.9 16" />
    </HandDrawnIcon>
  );
}

export function Brackets(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Brackets">
      <path d="M16.1 3.1c1.2-.1 2.5-.1 3.7 0 .6 0 1.1.5 1.1 1.1.1 5.2.1 10.4 0 15.6 0 .6-.5 1.1-1.1 1.1-1.2.1-2.5.1-3.7 0" />
      <path d="M7.9 3.1c-1.2-.1-2.5-.1-3.7 0-.6 0-1.1.5-1.1 1.1-.1 5.2-.1 10.4 0 15.6 0 .6.5 1.1 1.1 1.1 1.2.1 2.5.1 3.7 0" />
    </HandDrawnIcon>
  );
}

export function Globe(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Globe">
      <path d={LOOP} />
      <path d="M12.1 3.1c-2.4 2.4-3.6 5.6-3.6 8.9s1.2 6.5 3.6 8.9" />
      <path d="M12 3.1c2.4 2.4 3.6 5.6 3.6 8.9s-1.2 6.5-3.6 8.9" />
      <path d="M3.1 12.1c5.9-.1 11.9-.1 17.8 0" />
    </HandDrawnIcon>
  );
}

export function Home(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Home">
      <path d="M3.2 10.1c2.9-2.4 5.9-4.9 8.8-7.3 2.9 2.4 5.8 4.9 8.8 7.3.1 3.3.1 6.6 0 9.9 0 .6-.5 1.1-1.1 1.1-1.8.1-3.6.1-5.4 0-.1-2.4-.1-4.8 0-7.2-1.5-.1-3.1-.1-4.6 0 .1 2.4.1 4.8 0 7.2-1.8.1-3.6.1-5.4 0-.6 0-1.1-.5-1.1-1.1-.1-3.3-.1-6.6 0-9.9" />
    </HandDrawnIcon>
  );
}

export function ShoppingBag(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="ShoppingBag">
      <path d="M5.3 7.2c-.5 4.4-.9 8.8-1.2 13.2 0 .4.3.8.8.8 4.7.1 9.5.1 14.2 0 .5 0 .8-.4.8-.8-.3-4.4-.7-8.8-1.2-13.2-4.5-.2-9-.2-13.4 0z" />
      <path d="M8.6 10.6c-.2-2.2-.2-4.3.5-6 .6-1.4 1.7-2.1 2.9-2.1s2.3.7 2.9 2.1c.7 1.7.7 3.8.5 6" />
    </HandDrawnIcon>
  );
}

export function Building2(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Building2">
      <path d="M6.1 21.9c-.1-6.4-.1-12.8 0-19.2 0-.6.4-1 1-1 3.3-.1 6.6-.1 9.9 0 .6 0 1 .4 1 1 .1 6.4.1 12.8 0 19.2" />
      <path d="M6.1 11.9c-1.1 0-2.2-.1-3.2 0-.6 0-1 .4-1 1-.1 3-.1 6 0 9" />
      <path d="M18.1 8.9c1 0 2.1-.1 3.1 0 .6 0 1 .4 1 1 .1 4 .1 8 0 12" />
      <path d="M10.1 21.9c0-1.3-.1-2.6 0-3.9 1.3-.1 2.6-.1 3.9 0 .1 1.3.1 2.6 0 3.9" />
      <path d="M10.1 6c1.3-.1 2.6-.1 3.9 0" />
      <path d="M10.1 10c1.3.1 2.6.1 3.9 0" />
      <path d="M10.1 14c1.3-.1 2.6-.1 3.9 0" />
      <path d="M1.9 22c6.7.1 13.4.1 20.2-.1" />
    </HandDrawnIcon>
  );
}

export function Microwave(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Microwave">
      <path d="M3.9 4.1c5.4-.1 10.8-.1 16.2 0 1 0 1.8.8 1.8 1.8.1 3.7.1 7.4 0 11.1 0 1-.8 1.8-1.8 1.8-5.4.1-10.8.1-16.2 0-1 0-1.8-.8-1.8-1.8-.1-3.7-.1-7.4 0-11.1 0-1 .8-1.8 1.8-1.8" />
      <path d="M5.9 8.1c2.7-.1 5.4-.1 8.1 0 .1 1.6.1 3.2 0 4.8-2.7.1-5.4.1-8.1 0-.1-1.6-.1-3.2 0-4.8" />
      <path d="M17.9 7.9c0 1.7-.1 3.4 0 5.1" />
      <path d="M6 18.9c0 .7-.1 1.4 0 2.1" />
      <path d="M18 18.9c.1.7.1 1.4 0 2.1" />
    </HandDrawnIcon>
  );
}
