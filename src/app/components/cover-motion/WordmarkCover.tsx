'use client';

import Image from 'next/image';

/**
 * The unparty.app wordmark (cover-010) as a living logo. Everything comes from
 * the one PNG the site already loads:
 *
 * - the wordmark itself, with a round hole where its period sits
 * - the period, a badge cut from the same PNG (public/cover-motion/), turning
 *   slowly in that hole like a record
 * - a yellow copy of the wordmark behind it (the same image, recolored by an
 *   SVG filter), drifting out of line and back like a print whose second
 *   color is slightly off
 * - a slow breath on the whole logo
 *
 * The logo is whole and legible in every frame. Motion lives in globals.css
 * (.wordmark-breath, .wordmark-misprint, .wordmark-badge) and stops under prefers-reduced-motion.
 */

const SRC = '/covers/cover-010.png';
const BADGE_SRC = '/cover-motion/cover-010-badge.png';
// Badge geometry in cover-010's 4269x2400 pixels, as percentages of the frame
const HOLE = { x: '66.142%', y: '56.879%', rx: '2.038%', ry: '3.625%' };
const BADGE = { left: '64.09%', top: '53.208%', width: '4.123%', height: '7.333%' };

const WordmarkCover: React.FC<{ alt: string }> = ({ alt }) => (
  <div className="mb-8 w-screen mx-[calc(50%-50vw)]">
    <div className="image-container-responsive image-container-cover border border-border" style={{ containerType: 'size' }}>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="wordmark-misprint-ink" colorInterpolationFilters="sRGB">
          <feFlood floodColor="#F9C22E" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      </svg>
      {/* The artwork's own 16:9 frame, covering the hero the way object-cover would */}
      <div
        className="wordmark-breath absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'max(100cqw, calc(100cqh * 4269 / 2400))', aspectRatio: '4269 / 2400' }}
      >
        <Image
          src={SRC}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          quality={90}
          className="wordmark-misprint"
          style={{ filter: 'url(#wordmark-misprint-ink)' }}
        />
        <Image
          src={SRC}
          alt={alt}
          fill
          sizes="100vw"
          quality={90}
          priority
          style={{
            maskImage: `radial-gradient(ellipse ${HOLE.rx} ${HOLE.ry} at ${HOLE.x} ${HOLE.y}, transparent 98%, #000 100%)`,
            WebkitMaskImage: `radial-gradient(ellipse ${HOLE.rx} ${HOLE.ry} at ${HOLE.x} ${HOLE.y}, transparent 98%, #000 100%)`,
          }}
        />
        <div className="wordmark-badge absolute" style={BADGE}>
          <Image src={BADGE_SRC} alt="" aria-hidden fill sizes="10vw" />
        </div>
      </div>
    </div>
  </div>
);

export default WordmarkCover;
