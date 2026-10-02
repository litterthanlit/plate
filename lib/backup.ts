import { sortVisits } from "./diary";
import { parsePlace, parseVisit } from "./storage";
import type { Place, Visit } from "./types";

/** Bump when the file shape changes; parseBackup must keep reading older ones. */
export const BACKUP_VERSION = 1;
/** localStorage tops out around 5 MB, so a bigger file can't be ours. */
export const BACKUP_MAX_BYTES = 5 * 1024 * 1024;

export type BackupFile = {
  app: "plate";
  version: number;
  exportedAt: string;
  visits: Visit[];
  places: Place[];
};

export type ParsedBackup = {
  exportedAt: number | null;
  visits: Visit[];
  places: Place[];
  /** Records that failed validation and were left out. */
  skipped: number;
};

export type BackupMode = "merge" | "replace";

export type RestorePlan = {
  visits: Visit[];
  places: Place[];
  added: number;
  updated: number;
  unchanged: number;
  placesAdded: number;
  /** Visits already here that a replace would drop. */
  dropped: number;
};

export function buildBackup(
  visits: readonly Visit[],
  places: readonly Place[],
  now = Date.now(),
): BackupFile {
  return {
    app: "plate",
    version: BACKUP_VERSION,
    exportedAt: new Date(now).toISOString(),
    visits: [...visits],
    places: places.filter((place) => place.custom),
  };
}

export function backupFilename(now = Date.now()): string {
  const date = new Date(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `plate-diary-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

/** Reads a backup file's text. Throws with a short reason. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Not a Plate copy. The file isn't JSON.");
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Not a Plate copy.");
  }
  const file = raw as Record<string, unknown>;
  if (file.app !== "plate") {
    throw new Error("Not a Plate copy.");
  }
  if (typeof file.version !== "number" || !Number.isInteger(file.version)) {
    throw new Error("Copy has no version. Can't read it.");
  }
  if (file.version > BACKUP_VERSION) {
    throw new Error("Made by a newer Plate. Update, then try again.");
  }
  if (!Array.isArray(file.visits) || !Array.isArray(file.places)) {
    throw new Error("Copy is missing its visits.");
  }

  let skipped = 0;
  const visits: Visit[] = [];
  const visitIds = new Set<string>();
  for (const item of file.visits) {
    const visit = parseVisit(item);
    if (!visit || visitIds.has(visit.id)) {
      skipped += 1;
      continue;
    }
    visitIds.add(visit.id);
    visits.push(visit);
  }
  const places: Place[] = [];
  const placeIds = new Set<string>();
  for (const item of file.places) {
    const place = parsePlace(item);
    if (!place || placeIds.has(place.id)) {
      skipped += 1;
      continue;
    }
    placeIds.add(place.id);
    places.push(place);
  }

  const exportedAt =
    typeof file.exportedAt === "string" ? Date.parse(file.exportedAt) : NaN;
  return {
    exportedAt: Number.isFinite(exportedAt) ? exportedAt : null,
    visits: sortVisits(visits),
    places,
    skipped,
  };
}

function lastTouched(visit: Visit): number {
  return visit.updatedAt ?? visit.createdAt;
}

/**
 * Works out what a restore would store, without storing it.
 * Merge keeps everything here and takes the newer side of any visit both have.
 */
export function planRestore(
  current: { visits: readonly Visit[]; places: readonly Place[] },
  backup: ParsedBackup,
  mode: BackupMode,
): RestorePlan {
  if (mode === "replace") {
    const incoming = new Set(backup.visits.map((visit) => visit.id));
    return {
      visits: sortVisits([...backup.visits]),
      places: [...backup.places],
      added: backup.visits.length,
      updated: 0,
      unchanged: 0,
      placesAdded: backup.places.length,
      dropped: current.visits.filter((visit) => !incoming.has(visit.id)).length,
    };
  }

  // A place saved on both devices from Google gets a different id only if
  // the slug collided; point the copy's visits at the one already here.
  const places = [...current.places];
  const placeIds = new Set(places.map((place) => place.id));
  const byGoogleId = new Map<string, string>();
  for (const place of places) {
    if (place.googlePlaceId) byGoogleId.set(place.googlePlaceId, place.id);
  }
  const remap = new Map<string, string>();
  let placesAdded = 0;
  for (const place of backup.places) {
    if (placeIds.has(place.id)) continue;
    const sameSpot = place.googlePlaceId
      ? byGoogleId.get(place.googlePlaceId)
      : undefined;
    if (sameSpot) {
      remap.set(place.id, sameSpot);
      continue;
    }
    places.push(place);
    placeIds.add(place.id);
    if (place.googlePlaceId) byGoogleId.set(place.googlePlaceId, place.id);
    placesAdded += 1;
  }

  const byId = new Map(current.visits.map((visit) => [visit.id, visit]));
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  for (const incoming of backup.visits) {
    const placeId = remap.get(incoming.placeId) ?? incoming.placeId;
    const visit = placeId === incoming.placeId ? incoming : { ...incoming, placeId };
    const existing = byId.get(visit.id);
    if (!existing) {
      byId.set(visit.id, visit);
      added += 1;
    } else if (lastTouched(visit) > lastTouched(existing)) {
      byId.set(visit.id, visit);
      updated += 1;
    } else {
      unchanged += 1;
    }
  }

  return {
    visits: sortVisits([...byId.values()]),
    places,
    added,
    updated,
    unchanged,
    placesAdded,
    dropped: 0,
  };
}
