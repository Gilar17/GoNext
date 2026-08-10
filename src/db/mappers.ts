import type { Place, PlacePhoto } from '@/src/types';

export type PlaceRow = {
  id: number;
  name: string;
  description: string;
  visitlater: number;
  liked: number;
  dd: string | null;
  created_at: string;
};

export type PlacePhotoRow = {
  id: number;
  place_id: number;
  file_path: string;
  created_at: string;
};

export type TripRow = {
  id: number;
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  current: number;
};

export type TripPlaceRow = {
  id: number;
  trip_id: number;
  place_id: number;
  sort_order: number;
  visited: number;
  visit_date: string | null;
  notes: string;
};

export type TripPlacePhotoRow = {
  id: number;
  trip_place_id: number;
  file_path: string;
  created_at: string;
};

export function toBool(value: number): boolean {
  return value === 1;
}

export function fromBool(value: boolean | undefined, fallback = false): number {
  return (value ?? fallback) ? 1 : 0;
}

/** Нормализует пару DD: обрезает пробелы; пустая строка → null. */
export function normalizeDd(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapPlacePhoto(row: PlacePhotoRow): PlacePhoto {
  return {
    id: row.id,
    placeId: row.place_id,
    filePath: row.file_path,
    createdAt: row.created_at,
  };
}

export function mapPlace(row: PlaceRow, photos: PlacePhoto[] = []): Place {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    visitlater: toBool(row.visitlater),
    liked: toBool(row.liked),
    dd: normalizeDd(row.dd),
    photos,
    createdAt: row.created_at,
  };
}
