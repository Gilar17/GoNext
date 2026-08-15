import i18n from '@/src/i18n';
import type { Place, PlaceInput, PlacePhoto } from '@/src/types';
import { deletePhotoFile, savePhotoFile } from '@/src/services/photos';
import { getDatabase } from './client';
import {
  mapPlace,
  mapPlacePhoto,
  fromBool,
  normalizeDd,
  type PlacePhotoRow,
  type PlaceRow,
} from './mappers';

async function getPlacePhotos(placeId: number): Promise<PlacePhoto[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PlacePhotoRow>(
    'SELECT * FROM place_photos WHERE place_id = ? ORDER BY id ASC',
    placeId,
  );
  return rows.map(mapPlacePhoto);
}

async function mapPlaceWithPhotos(row: PlaceRow): Promise<Place> {
  const photos = await getPlacePhotos(row.id);
  return mapPlace(row, photos);
}

export async function createPlace(input: PlaceInput): Promise<Place> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO places (name, description, visitlater, liked, dd, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.name.trim(),
    input.description?.trim() ?? '',
    fromBool(input.visitlater),
    fromBool(input.liked),
    normalizeDd(input.dd),
    createdAt,
  );

  const place = await getPlaceById(Number(result.lastInsertRowId));
  if (!place) {
    throw new Error(i18n.t('errors.createPlaceFailed'));
  }
  return place;
}

export async function getPlaceById(id: number): Promise<Place | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PlaceRow>(
    'SELECT * FROM places WHERE id = ?',
    id,
  );
  if (!row) {
    return null;
  }
  return mapPlaceWithPhotos(row);
}

export async function listPlaces(): Promise<Place[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PlaceRow>(
    'SELECT * FROM places ORDER BY created_at DESC',
  );
  return Promise.all(rows.map(mapPlaceWithPhotos));
}

export async function searchPlacesByName(query: string): Promise<Place[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PlaceRow>(
    `SELECT * FROM places
     WHERE name LIKE ?
     ORDER BY created_at DESC`,
    `%${query.trim()}%`,
  );
  return Promise.all(rows.map(mapPlaceWithPhotos));
}

export async function updatePlace(
  id: number,
  input: PlaceInput,
): Promise<Place | null> {
  const db = await getDatabase();
  const existing = await getPlaceById(id);
  if (!existing) {
    return null;
  }

  await db.runAsync(
    `UPDATE places
     SET name = ?, description = ?, visitlater = ?, liked = ?, dd = ?
     WHERE id = ?`,
    input.name.trim(),
    input.description?.trim() ?? '',
    fromBool(input.visitlater, existing.visitlater),
    fromBool(input.liked, existing.liked),
    input.dd === undefined ? existing.dd : normalizeDd(input.dd),
    id,
  );

  return getPlaceById(id);
}

export async function deletePlace(id: number): Promise<boolean> {
  const db = await getDatabase();
  const photos = await getPlacePhotos(id);
  const result = await db.runAsync('DELETE FROM places WHERE id = ?', id);
  if (result.changes > 0) {
    await Promise.all(photos.map((photo) => deletePhotoFile(photo.filePath)));
    return true;
  }
  return false;
}

export async function addPlacePhoto(
  placeId: number,
  sourceUri: string,
): Promise<PlacePhoto> {
  const place = await getPlaceById(placeId);
  if (!place) {
    throw new Error(i18n.t('errors.placeNotFoundId', { id: placeId }));
  }

  const filePath = await savePhotoFile(sourceUri);
  const createdAt = new Date().toISOString();
  const db = await getDatabase();

  try {
    const result = await db.runAsync(
      `INSERT INTO place_photos (place_id, file_path, created_at)
       VALUES (?, ?, ?)`,
      placeId,
      filePath,
      createdAt,
    );

    return {
      id: Number(result.lastInsertRowId),
      placeId,
      filePath,
      createdAt,
    };
  } catch (error) {
    await deletePhotoFile(filePath);
    throw error;
  }
}

export async function deletePlacePhoto(photoId: number): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PlacePhotoRow>(
    'SELECT * FROM place_photos WHERE id = ?',
    photoId,
  );
  if (!row) {
    return false;
  }

  await db.runAsync('DELETE FROM place_photos WHERE id = ?', photoId);
  await deletePhotoFile(row.file_path);
  return true;
}
