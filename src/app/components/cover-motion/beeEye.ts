/**
 * The bee's-eye shader behind `coverStyle` and the zinnia's landing: a cover
 * photo drawn through a compound eye (hex lens facets), a tiled grid (square
 * facets) and/or a six-fold kaleidoscope. One fragment shader, WebGL 1, no
 * library. Each facet is a small convex lens that still shows its own
 * magnified piece of the photo (not one averaged color), darker toward its
 * hairline rim, with a soft highlight.
 *
 * The caller owns the timeline and passes the frame's uniforms to draw();
 * nothing animates in here. Textures come from <img> elements the page has
 * already loaded (next/image's currentSrc), so nothing downloads twice, or
 * from a <canvas> the caller painted (a coverColor's surface).
 */

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uSoft;
uniform vec2 uView;        // canvas size, device px
uniform vec4 uCrop;        // image rect in view px: x, y, width, height
uniform float uSoftYellow; // 0..1 soft copy over the lower part of the photo
uniform float uSoftPink;   // 0..1 soft copy over the upper part
uniform float uHasSoft;
uniform float uFacet;      // 0..1 the eye focusing in: lens zoom, rims, dome all grow with it
uniform float uSquare;     // 0 hex (compound eye), 1 square (tile)
uniform float uFacetSize;  // facet width, device px
uniform float uKaleido;    // 0..1 kaleidoscope mix
uniform float uTurn;       // kaleidoscope rotation, radians
uniform vec2 uCenter;      // kaleidoscope center, view px
uniform float uBulge;      // 0..1 domed-eye magnification toward uCenter

const float PI = 3.14159265;

vec3 photo(vec2 p) {
  vec2 uv = clamp((p - uCrop.xy) / uCrop.zw, 0.0, 1.0);
  vec3 sharp = texture2D(uImage, uv).rgb;
  if (uHasSoft < 0.5) return sharp;
  vec3 soft = texture2D(uSoft, uv).rgb;
  float lower = smoothstep(0.34, 0.44, uv.y) * uSoftYellow;
  float upper = (1.0 - smoothstep(0.30, 0.40, uv.y)) * uSoftPink;
  return mix(sharp, soft, clamp(lower + upper, 0.0, 1.0));
}

vec2 fold(vec2 p) {
  vec2 d = p - uCenter;
  float seg = PI / 3.0;
  float a = mod(atan(d.y, d.x) + uTurn, seg);
  a = min(a, seg - a);
  return uCenter + length(d) * vec2(cos(a), sin(a));
}

vec3 scene(vec2 p) {
  vec3 c = photo(p);
  if (uKaleido > 0.001) c = mix(c, photo(fold(p)), uKaleido);
  return c;
}

// A compound eye is a dome: the middle magnifies, the edges curve away
vec2 dome(vec2 p) {
  vec2 d = p - uCenter;
  float r = length(d) / length(uView);
  return uCenter + d * (1.0 - uFacet * uBulge * 0.22 * (1.0 - min(r * 2.0, 1.0)));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uView.y - gl_FragCoord.y);
  if (uFacet < 0.001) { gl_FragColor = vec4(scene(p), 1.0); return; }

  // Nearest facet center: pointy-top hex grid (two offset lattices), or squares
  vec2 uv = p / uFacetSize;
  vec2 local;
  float edge;
  if (uSquare > 0.5) {
    local = fract(uv) - 0.5;
    edge = max(abs(local.x), abs(local.y));
  } else {
    vec2 r = vec2(1.0, 1.7320508);
    vec2 h = r * 0.5;
    vec2 a = mod(uv, r) - h;
    vec2 b = mod(uv - h, r) - h;
    local = dot(a, a) < dot(b, b) ? a : b;
    vec2 q = abs(local);
    edge = max(dot(q, normalize(r)), q.x);
  }
  vec2 center = (uv - local) * uFacetSize;

  // Each facet a small convex lens, magnified gently around its own center so
  // neighbouring facets still join into one picture. Nothing is blended over
  // the plain photo (that ghosts): at uFacet 0 the zoom is 1 and the lens IS
  // the photo, so the facets grow out of it as the eye focuses in
  vec3 lens = scene(dome(center + local * uFacetSize / (1.0 + 0.15 * uFacet)));
  float rr = clamp(edge / 0.5, 0.0, 1.0);
  lens *= 1.0 - uFacet * 0.18 * rr * rr;
  vec2 hl = (local - vec2(-0.14, -0.17)) / vec2(0.16, 0.11);
  lens += uFacet * 0.07 * exp(-dot(hl, hl));

  // Hairline rim, about 1 device px: a seam, not a black grid
  float px = 1.0 / uFacetSize;
  float rim = smoothstep(0.5 - 1.6 * px, 0.5 - 0.4 * px, edge);
  lens = mix(lens, lens * 0.55, rim * 0.6 * uFacet);

  // The dome curving away: facets dim toward the frame's edge
  float fromCenter = length((p - uCenter) / uView);
  lens *= 1.0 - uFacet * uBulge * 0.3 * smoothstep(0.25, 0.75, fromCenter);

  gl_FragColor = vec4(lens, 1.0);
}
`;

export interface BeeEyeFrame {
  /** where the photo sits in the canvas, in CSS px: x, y, width, height */
  crop: [number, number, number, number];
  softYellow?: number;
  softPink?: number;
  facet: number;
  square?: boolean;
  /** facet width, CSS px */
  facetSize: number;
  kaleido: number;
  turn?: number;
  /** kaleidoscope center, CSS px (default: the canvas center) */
  center?: [number, number];
  /** 0..1 domed-eye magnification and edge falloff (default 1 with facets) */
  bulge?: number;
}

export interface BeeEyeRenderer {
  draw(frame: BeeEyeFrame): void;
  resize(): void;
  destroy(): void;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('bee-eye shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// A loaded <img>, or a <canvas> painted by the caller (a color cover's surface)
type Source = HTMLImageElement | HTMLCanvasElement;

function texture(gl: WebGLRenderingContext, unit: number, img: Source) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  return tex;
}

/** Returns null when WebGL is unavailable; the caller keeps its still/CSS cover. */
export function createBeeEye(
  canvas: HTMLCanvasElement,
  image: Source,
  soft?: Source
): BeeEyeRenderer | null {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const textures = [texture(gl, 0, image), soft ? texture(gl, 1, soft) : null];
  gl.uniform1i(u('uImage'), 0);
  gl.uniform1i(u('uSoft'), soft ? 1 : 0);
  gl.uniform1f(u('uHasSoft'), soft ? 1 : 0);

  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  };
  resize();

  return {
    resize,
    draw(f) {
      const [x, y, w, h] = f.crop;
      gl.uniform2f(u('uView'), canvas.width, canvas.height);
      gl.uniform4f(u('uCrop'), x * dpr, y * dpr, w * dpr, h * dpr);
      gl.uniform1f(u('uSoftYellow'), f.softYellow ?? 0);
      gl.uniform1f(u('uSoftPink'), f.softPink ?? 0);
      gl.uniform1f(u('uFacet'), f.facet);
      gl.uniform1f(u('uSquare'), f.square ? 1 : 0);
      gl.uniform1f(u('uFacetSize'), f.facetSize * dpr);
      gl.uniform1f(u('uKaleido'), f.kaleido);
      gl.uniform1f(u('uTurn'), f.turn ?? 0);
      const [cx, cy] = f.center ?? [canvas.clientWidth / 2, canvas.clientHeight / 2];
      gl.uniform2f(u('uCenter'), cx * dpr, cy * dpr);
      gl.uniform1f(u('uBulge'), f.bulge ?? 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    destroy() {
      textures.forEach((t) => t && gl.deleteTexture(t));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

// Facet width for a frame: ~1/32 of its width, kept between 22 and 44 CSS px
// so each lens stays readable on a phone and fine on a wide screen
export const facetSizeFor = (width: number) => Math.min(44, Math.max(22, width / 32));
