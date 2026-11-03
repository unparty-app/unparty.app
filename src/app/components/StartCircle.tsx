"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';

const StartCircle = () => {
  const { colorValue } = useTheme();

  return (
    <Link
      href="/"
      aria-label="Go to unparty.app home"
      className="flex size-12 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105 motion-reduce:transition-none"
      style={{ backgroundColor: colorValue }}
    >
      <Image
        src="/start-gradient.svg"
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-full object-cover"
        priority
      />
    </Link>
  );
};

export default StartCircle;
