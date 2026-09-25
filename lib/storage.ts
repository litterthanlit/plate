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

function parsePlace(value: unknown): Place | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || value.id.length === 0) return null;
  if (typeof value.name !== "string" || value.name.trim().length === 0) {
    return null;
  }
  if (typeof value.neighborhood !== "string") return null;
  if (typeof value.cuisine !== "string") return null;
  return {
    id: value.id,
    name: value.name.trim(),
    neighborhood: value.neighborhood.trim(),
    cuisine: value.cuisine.trim(),
    custom: true,
  };
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
