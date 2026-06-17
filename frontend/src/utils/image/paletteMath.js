/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} v 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Generates a deterministic pseudo-random number based on a seed.
 * @param {number} seed 
 * @returns {number}
 */
export const pseudoRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

/**
 * Generates coordinate points with organic, seeded scatter for color sampling.
 * @param {number} count 
 * @param {number} [variation=1] 
 * @returns {Array<{id: number, x: number, y: number}>}
 */
export function makeInitialPoints(count, variation = 1) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const pts = [];

  for (let i = 0; i < count; i += 1) {
    const c = i % cols;
    const r = Math.floor(i / cols);

    const baseX = cols === 1 ? 0.5 : 0.15 + (c / (cols - 1)) * 0.7;
    const baseY = rows === 1 ? 0.5 : 0.15 + (r / (rows - 1)) * 0.7;

    const noiseX = pseudoRandom(variation * 100 + i);
    const noiseY = pseudoRandom(variation * 200 + i);

    const scatterX = (noiseX - 0.5) * 0.5;
    const scatterY = (noiseY - 0.5) * 0.5;

    const x = clamp(baseX + scatterX, 0.08, 0.92);
    const y = clamp(baseY + scatterY, 0.08, 0.92);

    pts.push({ id: i, x, y });
  }
  return pts;
}

/**
 * Resizes the array of sampling points while preserving existing points when possible.
 * @param {Array<{id: number, x: number, y: number}>} prev 
 * @param {number} nextCount 
 * @param {number} [variation=1] 
 * @returns {Array<{id: number, x: number, y: number}>}
 */
export function resizePoints(prev, nextCount, variation = 1) {
  if (prev.length === nextCount) return prev;
  if (prev.length > nextCount) return prev.slice(0, nextCount);

  const extras = makeInitialPoints(nextCount, variation).slice(prev.length);
  return [...prev, ...extras.map((p, i) => ({ ...p, id: prev.length + i }))];
}