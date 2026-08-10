/**
 * Координаты в формате Decimal Degrees (DD) — одна строка-пара:
 * «55.744920, 37.604677»
 * (широта, долгота через запятую; как при копировании из карт).
 */
export type DecimalDegrees = string;

export type PlacePhoto = {
  id: number;
  placeId: number;
  filePath: string;
  createdAt: string;
};

export type Place = {
  id: number;
  name: string;
  description: string;
  visitlater: boolean;
  liked: boolean;
  /** Единая пара DD или null, если координат нет */
  dd: DecimalDegrees | null;
  photos: PlacePhoto[];
  createdAt: string;
};

export type PlaceInput = {
  name: string;
  description?: string;
  visitlater?: boolean;
  liked?: boolean;
  /** Единая пара DD, например «55.744920, 37.604677» */
  dd?: DecimalDegrees | null;
};

export type TripPlacePhoto = {
  id: number;
  tripPlaceId: number;
  filePath: string;
  createdAt: string;
};

export type TripPlace = {
  id: number;
  tripId: number;
  placeId: number;
  order: number;
  visited: boolean;
  visitDate: string | null;
  notes: string;
  photos: TripPlacePhoto[];
};

export type Trip = {
  id: number;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  places: TripPlace[];
  createdAt: string;
  current: boolean;
};

export type TripInput = {
  title: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean;
};
