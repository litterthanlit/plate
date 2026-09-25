import type { ListId, Place, Visit } from "./types";
import { SPEND_MAX_CENTS } from "./types";
import { findPlace } from "./places";

export type ListedPlace = {
  place: Place;
  latest: Visit;
};

export function placesOnList(
  visits: readonly Visit[],
  places: readonly Place[],
  listId: ListId,
): ListedPlace[] {
  const latestByPlace = new Map<string, Visit>();
  for (const visit of visits) {
    if (!visit.listIds.includes(listId)) continue;
    const current = latestByPlace.get(visit.placeId);
    if (!current || visit.visitedAt > current.visitedAt) {
      latestByPlace.set(visit.placeId, visit);
    }
  }

  const listed: ListedPlace[] = [];
  for (const [placeId, latest] of latestByPlace) {
    const place = findPlace(places, placeId);
    if (!place) continue;
    listed.push({ place, latest });
  }
  listed.sort((a, b) => b.latest.visitedAt - a.latest.visitedAt);
  return listed;
}

export function toggleListId(listIds: ListId[], id: ListId): ListId[] {
  return listIds.includes(id)
    ? listIds.filter((item) => item !== id)
    : [...listIds, id];
}

export function formatVisitTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function stars(rating: number): string {
  const filled = Math.min(5, Math.max(0, rating));
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
}

/** Newest meal first; ties (same minute) fall back to log order. */
export function sortVisits(visits: Visit[]): Visit[] {
  return visits.sort(
    (a, b) => b.visitedAt - a.visitedAt || b.createdAt - a.createdAt,
  );
}

const MONEY = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 4250 → "42.50". Receipts print the bare amount; add "$" at the total. */
export function formatCents(cents: number): string {
  return MONEY.format(cents / 100);
}

/**
 * Reads what people type into a bill field: "42", "42.5", "$42.50", "1,204".
 * Empty means not recorded (null). Anything else unreadable is undefined.
 */
export function parseSpendInput(raw: string): number | null | undefined {
  const cleaned = raw.trim().replace(/^\$/, "").replace(/,/g, "").trim();
  if (!cleaned) return null;
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return undefined;
  const cents = Math.round(Number(cleaned) * 100);
  if (!Number.isSafeInteger(cents) || cents > SPEND_MAX_CENTS) return undefined;
  return cents;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local "YYYY-MM-DD" and "HH:MM" for <input type="date|time">. */
export function toDateTimeInputs(timestamp: number): {
  date: string;
  time: string;
} {
  const d = new Date(timestamp);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Inverse of toDateTimeInputs, in local time. Null when either is blank. */
export function fromDateTimeInputs(date: string, time: string): number | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const tm = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dm || !tm) return null;
  const at = new Date(
    Number(dm[1]),
    Number(dm[2]) - 1,
    Number(dm[3]),
    Number(tm[1]),
    Number(tm[2]),
  ).getTime();
  return Number.isFinite(at) ? at : null;
}

export type PlaceTab = {
  /** 1-based: this was your nth meal at the place. */
  visitNumber: number;
  visitCount: number;
  /** Sum of recorded bills at the place up to and including this visit. */
  spentToDateCents: number;
};

/** Running tab for one place, as of a given visit. */
export function placeTab(visits: readonly Visit[], visit: Visit): PlaceTab {
  const here = visits
    .filter((v) => v.placeId === visit.placeId)
    .sort((a, b) => a.visitedAt - b.visitedAt || a.createdAt - b.createdAt);
  const index = here.findIndex((v) => v.id === visit.id);
  let spentToDateCents = 0;
  for (const v of here.slice(0, index + 1)) spentToDateCents += v.spendCents ?? 0;
  return { visitNumber: index + 1, visitCount: here.length, spentToDateCents };
}

/** Check number: the visit's position in your whole diary, oldest = 0001. */
export function checkNumber(visits: readonly Visit[], visit: Visit): string {
  const older = visits.filter(
    (v) =>
      v.visitedAt < visit.visitedAt ||
      (v.visitedAt === visit.visitedAt && v.createdAt < visit.createdAt),
  ).length;
  return String(older + 1).padStart(4, "0");
}
