export const AVATAR_COLOR_COUNT = 100;

/** 100 distinct letter-avatar colours spread around the colour wheel. */
export function avatarColor(index: number) {
  const i = ((Math.round(index) % AVATAR_COLOR_COUNT) + AVATAR_COLOR_COUNT) % AVATAR_COLOR_COUNT;
  const hue = (i * 360) / AVATAR_COLOR_COUNT;
  const lightness = i % 2 === 0 ? 0.72 : 0.6;
  return `oklch(${lightness} 0.17 ${hue.toFixed(1)})`;
}

export function initialOf(name?: string | null) {
  const ch = name?.trim().match(/[\p{L}\p{N}]/u)?.[0];
  return ch ? ch.toUpperCase() : "?";
}
