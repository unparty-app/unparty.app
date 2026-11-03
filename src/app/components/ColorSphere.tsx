'use client';
import React from 'react';

/**
 * ColorSphere - renders arbitrary color(s) as the brand's lit, textured
 * sphere instead of a flat-filled circle.
 *
 * Web port of the UNCOLOR iOS app's ColorSphere technique
 * (theunpartycharette repo, UNCOLOR/UI Components/ColorSphere.swift), built
 * from the same shared texture so the two apps' color circles read as the
 * same object:
 *
 * 1. One shared textured sphere PNG (Sphere-Red Bulb) is the
 *    luminance/shading base.
 * 2. grayscale(0.99) strips its red hue, keeping only highlight/shadow
 *    structure (iOS: .grayscale(0.99)).
 * 3. A multiply-blended color layer tints it — multiply keeps shadows dark
 *    and highlights bright, so it reads as a lit 3D bead, not a flat fill
 *    (iOS: .colorMultiply(color)).
 * 4. Up to 4 more colors layer in as additional tinted copies of the same
 *    texture, composited with screen / color-dodge / soft-light blend modes
 *    at partial opacity, for a multi-hue gradient bead from one asset.
 * 5. A color-tinted drop shadow grounds it.
 *
 * The texture's own alpha channel doubles as the CSS mask, so the swatch is
 * clipped to the sphere's exact silhouette (a masked sphere, not a
 * border-radius crop) and the drop shadow follows that silhouette.
 *
 * Adoption guide — where this should (and shouldn't) replace flat circles:
 * - YES: circles whose whole job is to represent a color value (brand/palette
 *   swatches like BrandPalette, saved-palette chips), at ~24px and up so the
 *   texture actually reads.
 * - NO: tiny decorative dots (the size-2/2.5 legend and divider markers —
 *   at that scale the texture is just noise), circles that carry content
 *   (rank badges, avatar/cover circles), and progress/track bars.
 *
 * One texture fetch is shared by every sphere on the page (same URL for
 * layers and mask); each sphere itself is a few GPU-composited layers.
 */

const SPHERE_TEXTURE_URL = '/svgs/unparty/Sphere-Red%20Bulb.png';

// The sphere's alpha bounding box inside the 2560x1656 texture canvas:
// left 918, top 428, 849x848 wide/tall (measured from the PNG's alpha).
// These size/position values scale and shift the canvas so the sphere's
// silhouette exactly fills the component box; the same values drive both the
// visible texture layers and the mask so they stay pixel-aligned.
//   size:     canvas / sphere      -> 2560/849 x, 1656/848 y
//   position: left / (canvas - sphere) -> 918/1711 x, 428/808 y
const TEXTURE_FIT_SIZE = '301.531% 195.283%';
const TEXTURE_FIT_POSITION = '53.653% 52.97%';

// iOS composites colors 2-5 over the base with .screen / .colorDodge /
// .softLight at partial opacity; same order and spirit here.
const EXTRA_LAYER_BLENDS: NonNullable<React.CSSProperties['mixBlendMode']>[] =
  ['screen', 'color-dodge', 'soft-light', 'soft-light'];
const EXTRA_LAYER_OPACITIES = [0.55, 0.4, 0.65, 0.65];

// Grayscale shading base — one shared style object for the base sphere and
// every extra tinted copy.
const textureLayerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `url("${SPHERE_TEXTURE_URL}")`,
  backgroundSize: TEXTURE_FIT_SIZE,
  backgroundPosition: TEXTURE_FIT_POSITION,
  backgroundRepeat: 'no-repeat',
  filter: 'grayscale(0.99)',
};

// Masked compositing surface: isolation keeps the multiply/screen/dodge
// layers blending with each other (never with the page behind), and the
// texture-alpha mask clips the whole stack to the sphere silhouette.
const maskedStackStyle: React.CSSProperties = {
  position: 'relative',
  display: 'block',
  width: '100%',
  height: '100%',
  isolation: 'isolate',
  maskImage: `url("${SPHERE_TEXTURE_URL}")`,
  maskSize: TEXTURE_FIT_SIZE,
  maskPosition: TEXTURE_FIT_POSITION,
  maskRepeat: 'no-repeat',
  WebkitMaskImage: `url("${SPHERE_TEXTURE_URL}")`,
  WebkitMaskSize: TEXTURE_FIT_SIZE,
  WebkitMaskPosition: TEXTURE_FIT_POSITION,
  WebkitMaskRepeat: 'no-repeat',
};

// #RRGGBB -> #RRGGBBAA for the tinted drop shadow; anything else (rgb(),
// named colors) falls back to the color as-is rather than corrupting it.
const withAlpha = (color: string, alphaHex: string): string =>
  /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alphaHex}` : color;

const ColorSphere: React.FC<{
  /** 1-5 colors: first is the multiply-tinted base, the rest layer in. */
  colors: string[];
  /** Rendered diameter in px. */
  size?: number;
  className?: string;
}> = ({ colors, size = 56, className }) => {
  const [base, ...extras] = colors;
  if (!base) return null;

  return (
    // Decorative: the parent control carries the accessible color name/hex.
    // The drop shadow lives on this outer wrapper because filters apply
    // before masks on the same element — out here it wraps the already-masked
    // silhouette, like the iOS .shadow modifier.
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'block',
        width: size,
        height: size,
        filter: `drop-shadow(0 ${Math.round(size * 0.11)}px ${Math.round(size * 0.18)}px ${withAlpha(base, '59')})`,
      }}
    >
      <span style={maskedStackStyle}>
        <span style={textureLayerStyle} />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: base,
            mixBlendMode: 'multiply',
          }}
        />
        {extras.slice(0, EXTRA_LAYER_BLENDS.length).map((color, i) => (
          <span
            key={`${color}-${i}`}
            style={{
              position: 'absolute',
              inset: 0,
              isolation: 'isolate',
              mixBlendMode: EXTRA_LAYER_BLENDS[i],
              opacity: EXTRA_LAYER_OPACITIES[i],
            }}
          >
            <span style={textureLayerStyle} />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: color,
                mixBlendMode: 'multiply',
              }}
            />
          </span>
        ))}
      </span>
    </span>
  );
};

export default ColorSphere;
