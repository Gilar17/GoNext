import type { Trip, TripInput, TripPlace } from '@/src/types';
import { getDatabase } from './client';
import { fromBool, toBool, type TripPlaceRow, type TripRow } from './mappers';
import {
  getTripPlacesByTripId,
  deleteTripPlacePhotosFiles,
} from './tripPlacesRepository';

async function mapTripWithPlaces(row: TripRow): Promise<Trip> {
  const places = await getTripPlacesByTripId(row.id);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    places,
    createdAt: row.created_at,
    current: toBool(row.current),
  };
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const makeCurrent = input.current === true;

  if (makeCurrent) {
    await db.runAsync('UPDATE trips SET current = 0');
  }

  const result = await db.runAsync(
    `INSERT INTO trips (title, description, start_date, end_date, created_at, current)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.title.trim(),
    input.description?.trim() ?? '',
    input.startDate ?? null,
    input.endDate ?? null,
    createdAt,
    fromBool(makeCurrent),
  );

  const trip = await getTripById(Number(result.lastInsertRowId));
  if (!trip) {
    throw new Error('Не удалось создать поездку');
  }
  return trip;
}

export async function getTripById(id: number): Promise<Trip | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TripRow>(
    'SELECT * FROM trips WHERE id = ?',
    id,
  );
  if (!row) {
    return null;
  }
  return mapTripWithPlaces(row);
}

export async function listTrips(): Promise<Trip[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TripRow>(
    'SELECT * FROM trips ORDER BY created_at DESC',
  );
  return Promise.all(rows.map(mapTripWithPlaces));
}

export async function getCurrentTrip(): Promise<Trip | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TripRow>(
    'SELECT * FROM trips WHERE current = 1 LIMIT 1',
  );
  if (!row) {
    return null;
  }
  return mapTripWithPlaces(row);
}

export async function updateTrip(
  id: number,
  input: TripInput,
): Promise<Trip | null> {
  const db = await getDatabase();
  const existing = await getTripById(id);
  if (!existing) {
    return null;
  }

  const makeCurrent = input.current === true;
  if (makeCurrent) {
    await db.runAsync('UPDATE trips SET current = 0');
  }

  await db.runAsync(
    `UPDATE trips
     SET title = ?, description = ?, start_date = ?, end_date = ?, current = ?
     WHERE id = ?`,
    input.title.trim(),
    input.description?.trim() ?? existing.description,
    input.startDate === undefined ? existing.startDate : input.startDate,
    input.endDate === undefined ? existing.endDate : input.endDate,
    input.current === undefined
      ? fromBool(existing.current)
      : fromBool(makeCurrent),
    id,
  );

  return getTripById(id);
}

export async function setCurrentTrip(id: number): Promise<Trip | null> {
  const db = await getDatabase();
  const existing = await getTripById(id);
  if (!existing) {
    return null;
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE trips SET current = 0');
    await db.runAsync('UPDATE trips SET current = 1 WHERE id = ?', id);
  });

  return getTripById(id);
}

export async function deleteTrip(id: number): Promise<boolean> {
  const db = await getDatabase();
  const places = await getTripPlacesByTripId(id);

  for (const place of places) {
    await deleteTripPlacePhotosFiles(place);
  }

  const result = await db.runAsync('DELETE FROM trips WHERE id = ?', id);
  return result.changes > 0;
}

export type { TripPlace };
