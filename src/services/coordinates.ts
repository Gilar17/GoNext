import type { DecimalDegrees } from '@/src/types';

export type ParsedCoordinates = {
  latitude: number;
  longitude: number;
};

/** Ровно 6 цифр после точки у каждой координаты: «55.744920, 37.604677». */
const DD_PAIR_PATTERN = /^(-?\d+\.\d{6})\s*,\s*(-?\d+\.\d{6})$/;

/**
 * Единый разбор и проверка пары DD вида «55.744920, 37.604677».
 * Формат исходной строки проверяется до Number: ровно 6 знаков после точки.
 * Широта: −90…90, долгота: −180…180. Пустое или некорректное значение → null.
 */
export function parseDdPair(dd: string | null | undefined): ParsedCoordinates | null {
  if (!dd) {
    return null;
  }

  const match = dd.trim().match(DD_PAIR_PATTERN);
  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

export function formatDdPair(latitude: number, longitude: number): DecimalDegrees {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function isValidDdPair(dd: string | null | undefined): boolean {
  if (dd == null || dd.trim() === '') {
    return true;
  }
  return parseDdPair(dd) != null;
}
