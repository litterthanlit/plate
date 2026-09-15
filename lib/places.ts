import type { Place } from "./types";

export const METRO = "Portland";

export const SEED_PLACES: readonly Place[] = [
  {
    id: "nightjar",
    name: "Nightjar",
    neighborhood: "Alberta",
    cuisine: "wine bar",
  },
  {
    id: "split-pea",
    name: "Split Pea",
    neighborhood: "Division",
    cuisine: "diner",
  },
  {
    id: "low-tide",
    name: "Low Tide",
    neighborhood: "St. Johns",
    cuisine: "seafood",
  },
  {
    id: "red-bowl",
    name: "Red Bowl",
    neighborhood: "Hawthorne",
    cuisine: "noodles",
  },
  {
    id: "counterweight",
    name: "Counterweight",
    neighborhood: "Kerns",
    cuisine: "bakery",
  },
  {
    id: "two-fools",
    name: "Two Fools",
    neighborhood: "Mississippi",
    cuisine: "pizza",
  },
  {
    id: "salt-pine",
    name: "Salt & Pine",
    neighborhood: "Sellwood",
    cuisine: "new american",
  },
  {
    id: "little-room",
    name: "Little Room",
    neighborhood: "Alberta",
    cuisine: "tacos",
  },
  {
    id: "the-fold",
    name: "The Fold",
    neighborhood: "Division",
    cuisine: "sandwiches",
  },
  {
    id: "marigold",
    name: "Marigold",
    neighborhood: "Hawthorne",
    cuisine: "indian",
  },
  {
    id: "hoppers",
    name: "Hopper's",
    neighborhood: "Mississippi",
    cuisine: "burgers",
  },
  {
    id: "glass-onion",
    name: "Glass Onion",
    neighborhood: "Kerns",
    cuisine: "vegetarian",
  },
  {
    id: "last-call",
    name: "Last Call Noodles",
    neighborhood: "Division",
    cuisine: "late night",
  },
  {
    id: "birch-table",
    name: "Birch Table",
    neighborhood: "Sellwood",
    cuisine: "brunch",
  },
  {
    id: "paloma",
    name: "Paloma",
    neighborhood: "Alberta",
    cuisine: "mexican",
  },
];

export function mergePlaces(
  seed: readonly Place[],
  custom: readonly Place[],
): Place[] {
  const seen = new Set<string>();
  const merged: Place[] = [];
  for (const place of [...custom, ...seed]) {
    if (seen.has(place.id)) continue;
    seen.add(place.id);
    merged.push(place);
  }
  return merged;
}

export function searchPlaces(places: readonly Place[], query: string): Place[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...places];
  return places.filter((place) => {
    const haystack =
      `${place.name} ${place.neighborhood} ${place.cuisine}`.toLowerCase();
    return haystack.includes(needle);
  });
}

export function findPlace(
  places: readonly Place[],
  id: string,
): Place | undefined {
  return places.find((place) => place.id === id);
}

export function slugifyPlaceName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "place";
}
