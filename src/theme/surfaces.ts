import { mixHex } from '@/src/theme/primaryColors';

export type ColorSchemeName = 'light' | 'dark';

export type SurfaceColors = {
  appBackground: string;
  card: string;
  cardItem: string;
  mutedText: string;
  bodyText: string;
  filterIdle: string;
  photoPlaceholder: string;
  sheet: string;
  noteText: string;
};

export function getSurfaceColors(
  scheme: ColorSchemeName,
  primary = '#6750A4',
): SurfaceColors {
  if (scheme === 'dark') {
    return {
      appBackground: '#1C1B1F',
      card: 'rgba(44, 42, 52, 0.96)',
      cardItem: 'rgba(58, 55, 68, 0.94)',
      mutedText: '#B0AAB8',
      bodyText: '#E6E1E5',
      filterIdle: mixHex(primary, '#1C1B1F', 0.58),
      photoPlaceholder: '#3A3842',
      sheet: '#2B2930',
      noteText: '#E6E1E5',
    };
  }

  return {
    appBackground: 'transparent',
    card: 'rgba(255,255,255,0.92)',
    cardItem: 'rgba(255,255,255,0.7)',
    mutedText: '#666666',
    bodyText: '#1C1B1F',
    filterIdle: mixHex(primary, '#FFFFFF', 0.82),
    photoPlaceholder: '#EEEEEE',
    sheet: 'rgba(255,255,255,0.98)',
    noteText: '#222222',
  };
}
