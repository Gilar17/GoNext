import * as Linking from 'expo-linking';
import type { DecimalDegrees } from '@/src/types';
import { parseDdPair } from './coordinates';

/** Открывает место на карте по одной паре DD. */
export async function openPlaceOnMap(dd: DecimalDegrees | null): Promise<void> {
  const parsed = parseDdPair(dd);
  if (!parsed) {
    throw new Error('Координаты места не заданы или имеют неверный формат');
  }

  const { latitude, longitude } = parsed;
  const query = `${latitude},${longitude}`;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Не удалось открыть карту');
  }

  await Linking.openURL(url);
}
