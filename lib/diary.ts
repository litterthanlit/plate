import type { ListId, Place, Visit } from "./types";
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
    if (!current || visit.createdAt > current.createdAt) {
      latestByPlace.set(visit.placeId, visit);
    }
  }

  const listed: ListedPlace[] = [];
  for (const [placeId, latest] of latestByPlace) {
    const place = findPlace(places, placeId);
    if (!place) continue;
    listed.push({ place, latest });
  }
  listed.sort((a, b) => b.latest.createdAt - a.latest.createdAt);
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
