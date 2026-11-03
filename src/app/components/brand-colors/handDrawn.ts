// Pen strokes for the brand color setup, in a 64×64 box (the mark: 64×10).
// Drawn by hand, not geometry: the ring wobbles and runs a little past where
// it started, the way a pen closes a circle; the ink sits slightly off-round.

/** The ring around each color, overshooting its start */
export const RING_PATH =
  'M33.5 7.2c12.4.3 23 10.3 23.3 23.6.3 13.9-10.2 25.6-24 25.9C19.2 57 7.8 46.9 7.4 33.3 7 19.3 17.4 8.2 30.4 7.5c4.2-.2 8.4.8 11.6 2.6';

/** The color itself, dropped into the ring */
export const INK_PATH =
  'M32.4 11.6c11.3-.1 20.3 8.9 20.2 20.4-.1 11.6-8.9 20.6-20.5 20.6C20.6 52.7 11.3 43.9 11.4 32.3 11.5 20.9 20.9 11.7 32.4 11.6z';

/** An empty ring's plus */
export const PLUS_PATH = 'M32.2 24.8c.3 4.6.2 9.4-.3 14.4M24.9 32.3c4.6-.4 9.4-.4 14.3.2';

/** The underline under the ring being picked */
export const MARK_PATH = 'M6 6.2c9.2-1.6 18.6-2.3 28-1.9 7.8.3 15.6 1.4 23.8.4';
