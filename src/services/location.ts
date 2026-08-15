import * as Location from 'expo-location';
import i18n from '@/src/i18n';
import type { DecimalDegrees } from '@/src/types';
import { formatDdPair } from './coordinates';

const LOCATION_DENIED_CODE = 'LOCATION_DENIED';
const UNAVAILABLE_CODE = 'LOCATION_UNAVAILABLE';

/**
 * Запрашивает разрешение только если его ещё можно спросить.
 * При постоянном отказе повторно системный диалог не открывает.
 */
async function ensureForegroundLocationPermission(): Promise<void> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.granted) {
    return;
  }

  if (!existing.canAskAgain) {
    throw new Error(LOCATION_DENIED_CODE);
  }

  const requested = await Location.requestForegroundPermissionsAsync();
  if (!requested.granted) {
    throw new Error(LOCATION_DENIED_CODE);
  }
}

function isUsableCoordinate(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function toFriendlyLocationError(error: unknown): Error {
  if (error instanceof Error && error.message === LOCATION_DENIED_CODE) {
    return new Error(i18n.t('errors.locationDenied'));
  }
  return new Error(i18n.t('errors.locationUnavailable'));
}

/** Возвращает текущие координаты как одну пару DD. */
export async function getCurrentDdPair(): Promise<DecimalDegrees> {
  try {
    await ensureForegroundLocationPermission();

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;
    if (
      !isUsableCoordinate(latitude, -90, 90) ||
      !isUsableCoordinate(longitude, -180, 180)
    ) {
      throw new Error(UNAVAILABLE_CODE);
    }

    return formatDdPair(latitude, longitude);
  } catch (error) {
    throw toFriendlyLocationError(error);
  }
}
