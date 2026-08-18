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

function channelLuminance(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) {
    return 0;
  }
  return (
    0.2126 * channelLuminance(rgb[0]) +
    0.7152 * channelLuminance(rgb[1]) +
    0.0722 * channelLuminance(rgb[2])
  );
}

export function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

/** Белый или тёмный текст/иконка на заданной заливке. */
export function getOnColor(background: string, minRatio = 4.5): string {
  if (contrastRatio('#FFFFFF', background) >= minRatio) {
    return '#FFFFFF';
  }
  return '#1C1B1F';
}

/**
 * Подбирает читаемый акцентный цвет на заданном фоне.
 * Если исходный primary уже даёт нужный контраст — возвращает его без изменений.
 */
export function getForegroundAccent(
  color: string,
  background: string,
  minRatio = 4.5,
): string {
  if (contrastRatio(color, background) >= minRatio) {
    return color;
  }

  const toward = relativeLuminance(background) > 0.5 ? '#000000' : '#FFFFFF';
  let lo = 0;
  let hi = 1;
  let best = mixHex(color, toward, 1);

  for (let i = 0; i < 14; i += 1) {
    const mid = (lo + hi) / 2;
    const candidate = mixHex(color, toward, mid);
    if (contrastRatio(candidate, background) >= minRatio) {
      best = candidate;
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return best;
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
