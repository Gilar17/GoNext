import * as Location from 'expo-location';
import type { DecimalDegrees } from '@/src/types';
import { formatDdPair } from './coordinates';

const DENIED_MESSAGE = 'Нет доступа к геопозиции';
const UNAVAILABLE_MESSAGE = 'Не удалось получить координаты';

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
    throw new Error(DENIED_MESSAGE);
  }

  const requested = await Location.requestForegroundPermissionsAsync();
  if (!requested.granted) {
    throw new Error(DENIED_MESSAGE);
  }
}

function isUsableCoordinate(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function toFriendlyLocationError(error: unknown): Error {
  if (error instanceof Error && error.message === DENIED_MESSAGE) {
    return error;
  }
  return new Error(UNAVAILABLE_MESSAGE);
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
      throw new Error(UNAVAILABLE_MESSAGE);
    }

    return formatDdPair(latitude, longitude);
  } catch (error) {
    throw toFriendlyLocationError(error);
  }
}
