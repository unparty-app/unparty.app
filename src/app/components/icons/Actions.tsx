'use client';

import HandDrawnIcon, { type HandDrawnIconProps } from './HandDrawnIcon';

// Actions (#1391): search, upload, play.

export function Search(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Search">
      <path d="M10.9 3.6c-4-.1-7.2 3.1-7.2 7 0 4 3.2 7.2 7.1 7.2 4 0 7.2-3.2 7.2-7.1 0-3.7-2.8-6.7-6.4-7.1" />
      <path d="M16.1 16.2c1.6 1.6 3.2 3.2 4.8 4.9" />
    </HandDrawnIcon>
  );
}

export function Upload(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Upload">
      <path d="M3.3 15.4c-.1 1.4 0 2.9 0 4.3 0 .6.5 1.1 1.1 1.1 5.1.1 10.1.1 15.2 0 .6 0 1.1-.5 1.1-1.1.1-1.5.1-2.9 0-4.4" />
      <path d="M12.1 15.7c-.1-3.9 0-7.9.1-11.8" />
      <path d="M7.4 8.3c1.6-1.5 3.1-3 4.7-4.6 1.5 1.5 3 3.1 4.5 4.7" />
    </HandDrawnIcon>
  );
}

export function Play(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Play">
      <path d="M6.4 4.1c-.1 5.3 0 10.6.1 15.9 4.3-2.6 8.6-5.3 12.9-7.9-4.4-2.7-8.7-5.4-13-8" />
    </HandDrawnIcon>
  );
}

export function Filter(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Filter">
      <path d="M3.2 4.4c5.9-.1 11.8-.1 17.6 0-2.3 2.8-4.6 5.5-6.9 8.3 0 2.6.1 5.1 0 7.7-1.3-.6-2.6-1.3-3.9-1.9 0-1.9.1-3.9 0-5.8-2.3-2.8-4.6-5.5-6.8-8.3" />
    </HandDrawnIcon>
  );
}

export function Download(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Download">
      <path d="M3.3 15.4c-.1 1.4 0 2.9 0 4.3 0 .6.5 1.1 1.1 1.1 5.1.1 10.1.1 15.2 0 .6 0 1.1-.5 1.1-1.1.1-1.5.1-2.9 0-4.4" />
      <path d="M12.1 3.6c-.1 3.9 0 7.9.1 11.8" />
      <path d="M7.4 11.2c1.6 1.5 3.1 3 4.7 4.6 1.5-1.5 3-3.1 4.5-4.7" />
    </HandDrawnIcon>
  );
}

export function Send(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Send">
      <path d="M21.4 2.8c-6.1 2.1-12.1 4.3-18.2 6.5 2.7 1.2 5.3 2.4 8 3.6 1.2 2.7 2.4 5.3 3.5 8 2.3-6 4.5-12 6.7-18.1" />
      <path d="M21.4 2.8c-3.4 3.4-6.8 6.7-10.2 10.1" />
    </HandDrawnIcon>
  );
}

export function Save(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Save">
      <path d="M5.2 3.3c3.9-.1 7.9-.1 11.8 0 1.4 1.4 2.8 2.8 4.1 4.2.1 3.8.1 7.6 0 11.4 0 1-.8 1.8-1.8 1.8-4.6.1-9.2.1-13.8 0-1 0-1.8-.8-1.8-1.8-.1-4.6-.1-9.2 0-13.8 0-1 .8-1.8 1.7-1.8" />
      <path d="M7.4 20.7c-.1-2.5 0-5 0-7.5 3.1-.1 6.1-.1 9.2 0 .1 2.5.1 5 0 7.5" />
      <path d="M7.6 3.4c0 1.6-.1 3.2 0 4.8 2.4.1 4.7.1 7.1 0" />
    </HandDrawnIcon>
  );
}

export function Edit3(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Edit3">
      <path d="M12.2 20.6c2.9.1 5.8.1 8.6-.1" />
      <path d="M16.4 3.8c.9-.9 2.3-.9 3.2 0 .9.9.9 2.3 0 3.2-3.9 4-7.9 7.9-11.9 11.8-1.5.4-3 .8-4.4 1.1.3-1.5.7-2.9 1.1-4.4 4-3.9 8-7.8 12-11.7" />
    </HandDrawnIcon>
  );
}

export function Trash2(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Trash2">
      <path d="M3.3 6.2c5.8-.1 11.6-.1 17.4 0" />
      <path d="M8.6 6c0-.9 0-1.8.1-2.6.1-.5.5-.9 1-.9 1.5-.1 3.1-.1 4.6 0 .5 0 .9.4 1 .9.1.9.1 1.7.1 2.6" />
      <path d="M5.4 6.4c.4 4.4.7 8.8 1 13.2.1 1 .9 1.8 1.9 1.8 2.5.1 5 .1 7.5 0 1 0 1.8-.8 1.9-1.8.3-4.4.6-8.8 1-13.2" />
      <path d="M10.1 10.8c0 2.1-.1 4.3 0 6.4" />
      <path d="M13.9 10.8c.1 2.1.1 4.3 0 6.4" />
    </HandDrawnIcon>
  );
}

export function Eraser(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Eraser">
      <path d="M7.1 21c-1.1-1.1-2.3-2.3-3.4-3.4-.8-.8-.8-2.1 0-2.9 3.7-3.8 7.4-7.5 11.2-11.2.8-.8 2.1-.8 2.9 0 1.4 1.4 2.8 2.8 4.2 4.2.8.8.8 2.1 0 2.9-3.2 3.5-6.6 6.9-10 10.4" />
      <path d="M7.1 21.1c4.6.1 9.2.1 13.8 0" />
      <path d="M5.3 10.9c2.6 2.6 5.2 5.2 7.8 7.9" />
    </HandDrawnIcon>
  );
}

export function Settings(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Settings">
      <path d="M12.2 2.6c.7 0 1.2.5 1.3 1.2.1.8.6 1.4 1.3 1.6.7.3 1.5.2 2.1-.3.5-.4 1.3-.4 1.8.1.5.5.5 1.2.1 1.8-.5.6-.6 1.4-.3 2.1.3.7.9 1.2 1.7 1.3.7.1 1.2.6 1.2 1.3s-.5 1.2-1.2 1.3c-.8.1-1.4.6-1.7 1.3-.3.7-.2 1.5.3 2.1.4.6.4 1.3-.1 1.8s-1.2.5-1.8.1c-.6-.5-1.4-.6-2.1-.3-.7.3-1.2.9-1.3 1.7-.1.7-.6 1.2-1.3 1.2s-1.2-.5-1.3-1.2c-.1-.8-.6-1.4-1.3-1.7-.7-.3-1.5-.2-2.1.3-.6.4-1.3.4-1.8-.1s-.5-1.2-.1-1.8c.5-.6.6-1.4.3-2.1-.3-.7-.9-1.2-1.7-1.3-.7-.1-1.2-.6-1.2-1.3s.5-1.2 1.2-1.3c.8-.1 1.4-.6 1.7-1.3.3-.7.2-1.5-.3-2.1-.4-.6-.4-1.3.1-1.8s1.2-.5 1.8-.1c.6.5 1.4.6 2.1.3.7-.3 1.2-.9 1.3-1.7.1-.6.6-1.1 1.2-1.1" />
      <path d="M12.1 9.1c-1.7-.1-3 1.3-3 2.9 0 1.7 1.3 3 3 3s3-1.4 3-3c0-1.5-1.1-2.7-2.6-2.9" />
    </HandDrawnIcon>
  );
}

export function Wrench(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Wrench">
      <path d="M14.6 6.3c-.4.4-.4 1 0 1.4.6.6 1.1 1.1 1.7 1.7.4.4 1 .4 1.4 0 1-1 2-2 3-3 .5 2.4-.3 4.9-2.2 6.4-1.9 1.6-4.4 2-6.7 1.2-2.4 2.4-4.8 4.8-7.2 7.1-.9.9-2.3.9-3.1 0-.9-.9-.9-2.2 0-3.1 2.3-2.4 4.7-4.8 7.1-7.2-.8-2.3-.4-4.8 1.2-6.7 1.5-1.9 4-2.7 6.4-2.2-1.1 1.1-2.1 2.1-3.1 3.1" />
    </HandDrawnIcon>
  );
}

export function Hammer(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Hammer">
      <path d="M14.3 3.6c1.9-.1 3.8 0 5.6 1.6.9.8 1.3 1.9 1.4 3-1.2.9-2.4 1.8-3.7 2.6-.9-.9-1.8-1.8-2.7-2.6-.4.4-.8.8-1.2 1.2-.9-.9-1.8-1.8-2.7-2.7 1.1-1.1 2.2-2.1 3.3-3.1" />
      <path d="M12.6 9.6c-2.8 2.9-5.6 5.8-8.4 8.6-.6.6-.6 1.6 0 2.2s1.6.6 2.2 0c2.8-2.9 5.7-5.7 8.5-8.6" />
    </HandDrawnIcon>
  );
}

export function Drill(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Drill">
      <path d="M9.6 4.4c3.7-.1 7.4-.1 11.1 0 .1 2.6.1 5.2 0 7.8-3.7.1-7.4.1-11.1 0-.9 0-1.7-.8-1.7-1.7-.1-1.5-.1-2.9 0-4.4 0-.9.8-1.7 1.7-1.7" />
      <path d="M7.9 8.3c-1.6 0-3.2-.1-4.8 0" />
      <path d="M14.1 12.3c-.6 2.9-1.2 5.8-1.8 8.7-.1.4.2.7.6.7 1.3.1 2.6.1 3.9 0 .4 0 .7-.3.6-.7-.4-2.9-.8-5.8-1.2-8.7" />
    </HandDrawnIcon>
  );
}

export function Maximize2(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Maximize2">
      <path d="M15.1 3.2c1.9-.1 3.8-.1 5.7 0 .1 1.9.1 3.8 0 5.7" />
      <path d="M8.9 20.8c-1.9.1-3.8.1-5.7 0-.1-1.9-.1-3.8 0-5.7" />
      <path d="M20.7 3.3c-2.4 2.3-4.7 4.7-7 7" />
      <path d="M3.3 20.7c2.3-2.4 4.7-4.7 7-7" />
    </HandDrawnIcon>
  );
}

export function Link2(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Link2">
      <path d="M9.1 17.1c-1.4 0-2.8.1-4.1-.1-2.6-.4-4.2-2.8-3.9-5.3.3-2.3 2.3-4 4.6-4 1.1 0 2.3-.1 3.4 0" />
      <path d="M14.9 7.1c1.3 0 2.7-.1 4 .1 2.6.4 4.2 2.8 3.9 5.3-.3 2.3-2.3 4-4.6 4-1.1 0-2.2.1-3.3 0" />
      <path d="M8.1 12.1c2.6.1 5.2.1 7.8-.1" />
    </HandDrawnIcon>
  );
}

export function Camera(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Camera">
      <path d="M14.6 4.2c-1.7-.1-3.5-.1-5.2 0-.7 1-1.4 2-2 3-1.2 0-2.4 0-3.6.1-1 0-1.8.8-1.8 1.8-.1 3.3-.1 6.6 0 9.9 0 1 .8 1.8 1.8 1.8 5.5.1 10.9.1 16.4 0 1 0 1.8-.8 1.8-1.8.1-3.3.1-6.6 0-9.9 0-1-.8-1.8-1.8-1.8-1.2-.1-2.4-.1-3.6-.1-.7-1-1.3-2-2-3" />
      <path d="M12.1 10.2c-1.7-.1-3.1 1.3-3.1 3s1.3 3.1 3 3.1 3.1-1.3 3.1-3c0-1.6-1.2-2.9-2.8-3.1" />
    </HandDrawnIcon>
  );
}

export function Tag(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Tag">
      <path d="M12.5 2.8c-2.9 0-5.8-.1-8.7 0-.6 0-1 .4-1 1-.1 2.9-.1 5.8 0 8.7 0 .3.1.5.3.7 3.5 3.5 7 7 10.5 10.4.5.5 1.3.5 1.8 0 2.7-2.6 5.3-5.2 7.9-7.9.5-.5.5-1.3 0-1.8-3.5-3.5-6.9-7-10.4-10.5-.1-.4-.3-.6-.4-.6" />
      <path d="M7.6 7.4h.1" />
    </HandDrawnIcon>
  );
}
