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
  /** When you ate. Can be earlier than createdAt for backfilled visits. */
  visitedAt: number;
  /** What the bill came to, tip in, in cents. Null when not recorded. */
  spendCents: number | null;
  createdAt: number;
  /** Set when the visit was edited after logging. */
  updatedAt?: number;
};

export const NOTE_MAX = 140;
export const RATING_MIN = 1;
export const RATING_MAX = 5;
/** $10,000 ceiling catches a slipped decimal, not a real dinner. */
export const SPEND_MAX_CENTS = 1_000_000;
