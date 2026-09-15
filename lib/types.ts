export const LIST_IDS = ["date-night", "cheap", "solo"] as const;

export type ListId = (typeof LIST_IDS)[number];

export type Place = {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  custom?: boolean;
  address?: string;
  googlePlaceId?: string;
  lat?: number;
  lng?: number;
  photoName?: string;
  photoAttribution?: string;
  photoAttributionUri?: string;
};

export type Visit = {
  id: string;
  placeId: string;
  rating: number;
  note: string;
  listIds: ListId[];
  createdAt: number;
};

export const NOTE_MAX = 140;
export const RATING_MIN = 1;
export const RATING_MAX = 5;
