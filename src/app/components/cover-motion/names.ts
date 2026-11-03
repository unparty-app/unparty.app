// Names an article can use for `coverMotion`. Kept apart from the registry
// (index.ts) so the article types can import it without pulling in React.
export type CoverMotionName = 'unparty-wordmark' | 'zinnia-tilt' | 'love-gathers';

// Names an article can use for `coverStyle`: a still cover seen through the
// bee's-eye shader (StyledCover, beeEye.ts)
export type CoverStyleName = 'compound-eye' | 'tile' | 'kaleidoscope';
