import { sortVisits } from "./diary";
import { isListId } from "./lists";
import type { ListId, Place, Visit } from "./types";
import { NOTE_MAX, RATING_MAX, RATING_MIN, SPEND_MAX_CENTS } from "./types";

const VISITS_KEY = "plate:visits:v1";
const PLACES_KEY = "plate:places:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseListIds(value: unknown): ListId[] {
  if (!Array.isArray(value)) return [];
  const ids: ListId[] = [];
  for (const item of value) {
    if (typeof item === "string" && isListId(item) && !ids.includes(item)) {
      ids.push(item);
    }
  }
  return ids;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

function parsePlace(value: unknown): Place | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || value.id.length === 0) return null;
  if (typeof value.name !== "string" || value.name.trim().length === 0) {
    return null;
  }
  if (typeof value.neighborhood !== "string") return null;
  if (typeof value.cuisine !== "string") return null;
  const place: Place = {
    id: value.id,
    name: value.name.trim(),
    neighborhood: value.neighborhood.trim(),
    cuisine: value.cuisine.trim(),
    custom: true,
  };
  const address = optionalString(value.address);
  if (address) place.address = address;
  const googlePlaceId = optionalString(value.googlePlaceId);
  if (googlePlaceId) place.googlePlaceId = googlePlaceId;
  const lat = optionalNumber(value.lat);
  const lng = optionalNumber(value.lng);
  if (lat !== undefined && lng !== undefined) {
    place.lat = lat;
    place.lng = lng;
  }
  const photoName = optionalString(value.photoName);
  if (photoName) place.photoName = photoName;
  const photoAttribution = optionalString(value.photoAttribution);
  if (photoAttribution) place.photoAttribution = photoAttribution;
  const photoAttributionUri = optionalString(value.photoAttributionUri);
  if (photoAttributionUri) place.photoAttributionUri = photoAttributionUri;
  return place;
}

function parseSpendCents(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 0 || value > SPEND_MAX_CENTS) return null;
  return value;
}

function parseVisit(value: unknown): Visit | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || value.id.length === 0) return null;
  if (typeof value.placeId !== "string" || value.placeId.length === 0) {
    return null;
  }
  if (typeof value.rating !== "number" || !Number.isInteger(value.rating)) {
    return null;
  }
  if (value.rating < RATING_MIN || value.rating > RATING_MAX) return null;
  if (typeof value.note !== "string") return null;
  if (typeof value.createdAt !== "number" || !Number.isFinite(value.createdAt)) {
    return null;
  }
  return {
    id: value.id,
    placeId: value.placeId,
    rating: value.rating,
    note: value.note.slice(0, NOTE_MAX),
    listIds: parseListIds(value.listIds),
    // v1 visits predate these fields: the log time was the visit time.
    visitedAt:
      typeof value.visitedAt === "number" && Number.isFinite(value.visitedAt)
        ? value.visitedAt
        : value.createdAt,
    spendCents: parseSpendCents(value.spendCents),
    createdAt: value.createdAt,
    ...(typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt)
      ? { updatedAt: value.updatedAt }
      : {}),
  };
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function loadVisits(): Visit[] {
  const parsed = readJson(VISITS_KEY);
  if (!Array.isArray(parsed)) return [];
  const visits: Visit[] = [];
  for (const item of parsed) {
    const visit = parseVisit(item);
    if (visit) visits.push(visit);
  }
  return sortVisits(visits);
}

export function saveVisits(visits: Visit[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
}

export function loadCustomPlaces(): Place[] {
  const parsed = readJson(PLACES_KEY);
  if (!Array.isArray(parsed)) return [];
  const places: Place[] = [];
  for (const item of parsed) {
    const place = parsePlace(item);
    if (place) places.push(place);
  }
  return places;
}

export function saveCustomPlaces(places: Place[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLACES_KEY, JSON.stringify(places));
}
