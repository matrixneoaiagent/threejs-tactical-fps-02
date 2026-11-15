export const PALETTE = {
  canvas: '#0f1115',
  surface: '#181b22',
  border: '#2b313d',
  ink: '#f1f5f9',
  muted: '#94a3b8',
  accent: '#e5a93c',
  blue: '#38bdf8',
  red: '#f87171',
  green: '#34d399',

  // Tactical theme aliases
  hazardYellow: '#e5a93c',
  syndicateRed: '#f87171',
  vanguardBlue: '#38bdf8',
  siteA: '#38bdf8',
  siteB: '#e5a93c',
  concrete: '#1f242d',
  metalPanel: '#2a303c',
  crateWood: '#3a332a',
  crateTrim: '#e5a93c',
  concreteLight: '#323a48',
};

export function hexToInt(hex) {
  if (typeof hex !== 'string') {
    throw new Error(`hexToInt: expected string, got ${typeof hex}`);
  }
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`hexToInt: invalid hex color string "${hex}" (must be 6 hex digits)`);
  }
  return Number.parseInt(clean, 16);
}
