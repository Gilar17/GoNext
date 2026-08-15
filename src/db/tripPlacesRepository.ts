import i18n from '@/src/i18n';
import type { TripPlace, TripPlacePhoto } from '@/src/types';
import { deletePhotoFile, savePhotoFile } from '@/src/services/photos';
import { getDatabase } from './client';
import {
  fromBool,
  toBool,
  type TripPlacePhotoRow,
  type TripPlaceRow,
} from './mappers';

async function getTripPlacePhotos(tripPlaceId: number): Promise<TripPlacePhoto[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TripPlacePhotoRow>(
    'SELECT * FROM trip_place_photos WHERE trip_place_id = ? ORDER BY id ASC',
    tripPlaceId,
  );
  return rows.map((row) => ({
    id: row.id,
    tripPlaceId: row.trip_place_id,
    filePath: row.file_path,
    createdAt: row.created_at,
  }));
}

function mapTripPlace(row: TripPlaceRow, photos: TripPlacePhoto[]): TripPlace {
  return {
    id: row.id,
    tripId: row.trip_id,
    placeId: row.place_id,
    order: row.sort_order,
    visited: toBool(row.visited),
    visitDate: row.visit_date,
    notes: row.notes,
    photos,
  };
}

async function mapTripPlaceWithPhotos(row: TripPlaceRow): Promise<TripPlace> {
  const photos = await getTripPlacePhotos(row.id);
  return mapTripPlace(row, photos);
}

export async function getTripPlacesByTripId(tripId: number): Promise<TripPlace[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TripPlaceRow>(
    `SELECT * FROM trip_places
     WHERE trip_id = ?
     ORDER BY sort_order ASC, id ASC`,
    tripId,
  );
  return Promise.all(rows.map(mapTripPlaceWithPhotos));
}

export async function getTripPlaceById(id: number): Promise<TripPlace | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TripPlaceRow>(
    'SELECT * FROM trip_places WHERE id = ?',
    id,
  );
  if (!row) {
    return null;
  }
  return mapTripPlaceWithPhotos(row);
}

export async function addPlaceToTrip(
  tripId: number,
  placeId: number,
  order?: number,
): Promise<TripPlace> {
  const db = await getDatabase();

  let sortOrder = order;
  if (sortOrder == null) {
    const last = await db.getFirstAsync<{ max_order: number | null }>(
      'SELECT MAX(sort_order) AS max_order FROM trip_places WHERE trip_id = ?',
      tripId,
    );
    sortOrder = (last?.max_order ?? -1) + 1;
  }

  const result = await db.runAsync(
    `INSERT INTO trip_places (trip_id, place_id, sort_order, visited, visit_date, notes)
     VALUES (?, ?, ?, 0, NULL, '')`,
    tripId,
    placeId,
    sortOrder,
  );

  const tripPlace = await getTripPlaceById(Number(result.lastInsertRowId));
  if (!tripPlace) {
    throw new Error(i18n.t('errors.addPlaceToTripFailed'));
  }
  return tripPlace;
}

/** Устанавливает порядок мест по массиву id trip_places. */
export async function reorderTripPlaces(
  tripId: number,
  tripPlaceIdsInOrder: number[],
): Promise<TripPlace[]> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (let index = 0; index < tripPlaceIdsInOrder.length; index += 1) {
      const tripPlaceId = tripPlaceIdsInOrder[index];
      await db.runAsync(
        `UPDATE trip_places
         SET sort_order = ?
         WHERE id = ? AND trip_id = ?`,
        index,
        tripPlaceId,
        tripId,
      );
    }
  });

  return getTripPlacesByTripId(tripId);
}

export async function markTripPlaceVisited(
  tripPlaceId: number,
  visited: boolean,
  visitDate?: string | null,
): Promise<TripPlace | null> {
  const db = await getDatabase();
  const existing = await getTripPlaceById(tripPlaceId);
  if (!existing) {
    return null;
  }

  const nextVisitDate = visited
    ? (visitDate ?? existing.visitDate ?? new Date().toISOString())
    : null;

  await db.runAsync(
    `UPDATE trip_places
     SET visited = ?, visit_date = ?
     WHERE id = ?`,
    fromBool(visited),
    nextVisitDate,
    tripPlaceId,
  );

  return getTripPlaceById(tripPlaceId);
}

export async function updateTripPlaceNotes(
  tripPlaceId: number,
  notes: string,
): Promise<TripPlace | null> {
  const db = await getDatabase();
  const existing = await getTripPlaceById(tripPlaceId);
  if (!existing) {
    return null;
  }

  await db.runAsync(
    'UPDATE trip_places SET notes = ? WHERE id = ?',
    notes,
    tripPlaceId,
  );

  return getTripPlaceById(tripPlaceId);
}

export async function removePlaceFromTrip(tripPlaceId: number): Promise<boolean> {
  const tripPlace = await getTripPlaceById(tripPlaceId);
  if (!tripPlace) {
    return false;
  }

  await deleteTripPlacePhotosFiles(tripPlace);
  const db = await getDatabase();
  const result = await db.runAsync(
    'DELETE FROM trip_places WHERE id = ?',
    tripPlaceId,
  );
  return result.changes > 0;
}

export async function addTripPlacePhoto(
  tripPlaceId: number,
  sourceUri: string,
): Promise<TripPlacePhoto> {
  const tripPlace = await getTripPlaceById(tripPlaceId);
  if (!tripPlace) {
    throw new Error(i18n.t('errors.tripPlaceNotFound', { id: tripPlaceId }));
  }

  const filePath = await savePhotoFile(sourceUri);
  const createdAt = new Date().toISOString();
  const db = await getDatabase();

  try {
    const result = await db.runAsync(
      `INSERT INTO trip_place_photos (trip_place_id, file_path, created_at)
       VALUES (?, ?, ?)`,
      tripPlaceId,
      filePath,
      createdAt,
    );

    return {
      id: Number(result.lastInsertRowId),
      tripPlaceId,
      filePath,
      createdAt,
    };
  } catch (error) {
    await deletePhotoFile(filePath);
    throw error;
  }
}

export async function deleteTripPlacePhoto(photoId: number): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TripPlacePhotoRow>(
    'SELECT * FROM trip_place_photos WHERE id = ?',
    photoId,
  );
  if (!row) {
    return false;
  }

  await db.runAsync('DELETE FROM trip_place_photos WHERE id = ?', photoId);
  await deletePhotoFile(row.file_path);
  return true;
}

export async function deleteTripPlacePhotosFiles(
  tripPlace: TripPlace,
): Promise<void> {
  await Promise.all(
    tripPlace.photos.map((photo) => deletePhotoFile(photo.filePath)),
  );
}
