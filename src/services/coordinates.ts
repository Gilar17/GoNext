import type { DecimalDegrees } from '@/src/types';

export type ParsedCoordinates = {
  latitude: number;
  longitude: number;
};

/**
 * Разбирает одну пару DD вида «55.744920, 37.604677».
 */
export function parseDdPair(dd: string | null | undefined): ParsedCoordinates | null {
  if (!dd) {
    return null;
  }

  const normalized = dd.trim().replace(/\s+/g, ' ');
  const match = normalized.match(
    /^(-?\d+(?:[.,]\d+)?)\s*,\s*(-?\d+(?:[.,]\d+)?)$/,
  );

  if (!match) {
    return null;
  }

  const latitude = Number(match[1].replace(',', '.'));
  const longitude = Number(match[2].replace(',', '.'));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

export function formatDdPair(latitude: number, longitude: number): DecimalDegrees {
  return `${latitude}, ${longitude}`;
}

export function isValidDdPair(dd: string | null | undefined): boolean {
  if (dd == null || dd.trim() === '') {
    return true;
  }
  return parseDdPair(dd) != null;
}
