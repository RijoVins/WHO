const SKINS = ['#ffb84d', '#ff8fb1', '#7ee0c3', '#a98bff', '#ffd94a', '#ff9a5c', '#6fd6ff', '#b8f06a', '#f7a6ff', '#ffc6a0'];
const ACCENTS = ['#ff3d8b', '#2ee6ff', '#ffc83d', '#9bea2e', '#8b3dff', '#ff7a1a'];
const EYES = ['round', 'happy', 'dots', 'wide'] as const;
const MOUTHS = ['smile', 'open', 'grin', 'oh'] as const;
const ACCESSORIES = ['none', 'partyhat', 'shades', 'mustache', 'bow', 'headphones', 'beanie'] as const;

export interface CharacterTraits {
  color: string;
  accent: string;
  eyes: (typeof EYES)[number];
  mouth: (typeof MOUTHS)[number];
  accessory: (typeof ACCESSORIES)[number];
  blinkDelay: number;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic look for a player id. */
export function characterTraits(id: string): CharacterTraits {
  const h = hash(id);
  return {
    color: SKINS[h % SKINS.length],
    accent: ACCENTS[(h >>> 4) % ACCENTS.length],
    eyes: EYES[(h >>> 8) % EYES.length],
    mouth: MOUTHS[(h >>> 11) % MOUTHS.length],
    accessory: ACCESSORIES[(h >>> 14) % ACCESSORIES.length],
    blinkDelay: -((h >>> 18) % 40) / 10,
  };
}
