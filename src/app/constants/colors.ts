// src/app/constants/colors.ts
// Imported from WelcomeColors.swift
import { BRAND_COLORS } from './organization';


export const colors = {
  // Main colors
  pushblack: "#371B70",
  deepSpace: "#0C0032",
  midnightBlue: "#190061",
  electricPurple: "#3500D3",
  neonYellow: "#FFF700",
  softWhite: "#F0F0F0",
  neonPink: "#FF00FF",
  electricBlue: "#00FFFF",
  electricGreen: "#00FF66",
  brandpurple: "#29284E",
  richblack: "#0D0C1D",
  cousinblack: "#14122B",
  pinkyblack: "#6C6BB4",
  silverblack: "#332F08",
  purpleblack: "#845FC7",
  pupblack: "#361D6E",
  astroblack: "#3D2D59",
  starblack: "#753062",
  brand: "#F9C22E", // the signature yellow
  champion: "#E7B12E",
  anotherlove: "#000108",
  nextyellow: "#E4C014",
  brandwhite: "#FFF1D6",
  healpurple: "#884455",
  brandblack: "#000605",
  coolblue: "#00BFFF",
  purpledanger: "#322741",
  keepgoing: "#20340B"
};

// The site's own color: the owner's first brand color (FoundersConfig
// brandColors), unparty's yellow until one is set. It's the default theme,
// the browser-bar tint and --brand-color (layout.tsx)
export const BRAND_COLOR = BRAND_COLORS[0] || colors.brand;

// Palette similar to the iOS app's color palette (Swift)
export const palette = {
  brand: BRAND_COLOR,
  brandblack: colors.brandblack,
  brandwhite: colors.brandwhite,
  electricPurple: colors.electricPurple,
  neonYellow: colors.neonYellow,
  astroblack: colors.astroblack,
  pinkyblack: colors.pinkyblack,
  starblack: colors.starblack,
  pushblack: colors.pushblack,
  champion: colors.champion,
  healpurple: colors.healpurple,
  electricGreen: colors.electricGreen,
  electricBlue: colors.electricBlue,
  anotherlove: colors.anotherlove,
  keepgoing: colors.keepgoing,
};

// Color names saved before the palette was renamed (in browsers and in Clerk
// metadata), so a returning visitor keeps their theme
export const RENAMED_COLORS: Record<string, keyof typeof colors> = {
  unparty: 'brand',
  unpartyblack: 'brandblack',
  unpartywhite: 'brandwhite',
  unpartypurple: 'brandpurple',
};

export default colors;