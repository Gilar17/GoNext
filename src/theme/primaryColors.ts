export const DEFAULT_PRIMARY = '#6750A4';

/** Десять основных цветов темы Paper. Первый — текущий фиолетовый GoNext. */
export const PRIMARY_COLORS = [
  '#6750A4',
  '#1D4ED8',
  '#0F766E',
  '#15803D',
  '#C2410C',
  '#B91C1C',
  '#BE185D',
  '#4338CA',
  '#B45309',
  '#334155',
] as const;

export function isPrimaryColor(value: string): boolean {
  return (PRIMARY_COLORS as readonly string[]).includes(value);
}

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace('#', '');
  const normalized =
    raw.length === 3
      ? raw
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => Math.round(value).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** t = 0 → a, t = 1 → b */
export function mixHex(a: string, b: string, t: number): string {
  const from = parseHex(a);
  const to = parseHex(b);
  if (!from || !to) {
    return a;
  }
  const clamped = Math.min(1, Math.max(0, t));
  return toHex(
    from[0] + (to[0] - from[0]) * clamped,
    from[1] + (to[1] - from[1]) * clamped,
    from[2] + (to[2] - from[2]) * clamped,
  );
}
