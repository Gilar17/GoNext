import * as Location from 'expo-location';
import type { DecimalDegrees } from '@/src/types';
import { formatDdPair } from './coordinates';

/** Возвращает текущие координаты как одну пару DD. */
export async function getCurrentDdPair(): Promise<DecimalDegrees> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Нет доступа к геолокации');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return formatDdPair(position.coords.latitude, position.coords.longitude);
}
