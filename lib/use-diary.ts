"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { METRO, SEED_PLACES, mergePlaces, slugifyPlaceName } from "./places";
import {
  loadCustomPlaces,
  loadVisits,
  saveCustomPlaces,
  saveVisits,
} from "./storage";
import type { ListId, Place, Visit } from "./types";
import { NOTE_MAX, RATING_MAX, RATING_MIN, SPEND_MAX_CENTS } from "./types";
import { sortVisits } from "./diary";

const EMPTY_VISITS: Visit[] = [];
const EMPTY_PLACES: Place[] = [];

type Listener = () => void;

function createClientStore<T>(
  load: () => T,
  save: (value: T) => void,
  empty: T,
) {
  let snapshot: T | null = null;
  const listeners = new Set<Listener>();

  function emit() {
    for (const listener of listeners) listener();
  }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot() {
    if (snapshot === null) {
      snapshot = load();
    }
    return snapshot;
  }

  function getServerSnapshot() {
    return empty;
  }

  function set(next: T) {
    snapshot = next;
    save(next);
    emit();
  }

  return { subscribe, getSnapshot, getServerSnapshot, set };
}

const visitsStore = createClientStore(loadVisits, saveVisits, EMPTY_VISITS);
const placesStore = createClientStore(
  loadCustomPlaces,
  saveCustomPlaces,
  EMPTY_PLACES,
);

/** Last voided visit, kept in memory for one undo. Not persisted. */
const voidedStore = createClientStore<Visit | null>(
  () => null,
  () => {},
  null,
);

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export type NewPlaceInput = {
  name: string;
  neighborhood?: string;
  cuisine?: string;
  address?: string;
  googlePlaceId?: string;
  lat?: number;
  lng?: number;
  photoName?: string;
  photoAttribution?: string;
  photoAttributionUri?: string;
};

export type NewVisitInput = {
  placeId: string;
  rating: number;
  note: string;
  listIds: ListId[];
  visitedAt: number;
  spendCents: number | null;
};

/** A minute of slack so "now" from the form never reads as the future. */
const FUTURE_SLACK_MS = 60_000;

/** Validates form input into the stored visit fields. Throws with a short reason. */
function cleanVisitInput(input: NewVisitInput): Omit<Visit, "id" | "createdAt"> {
  if (!input.placeId) {
    throw new Error("Pick a place");
  }
  if (
    !Number.isInteger(input.rating) ||
    input.rating < RATING_MIN ||
    input.rating > RATING_MAX
  ) {
    throw new Error("Rate 1 to 5");
  }
  if (!Number.isFinite(input.visitedAt)) {
    throw new Error("Pick when you ate");
  }
  if (input.visitedAt > Date.now() + FUTURE_SLACK_MS) {
    throw new Error("That meal hasn't happened yet");
  }
  if (
    input.spendCents !== null &&
    (!Number.isInteger(input.spendCents) ||
      input.spendCents < 0 ||
      input.spendCents > SPEND_MAX_CENTS)
  ) {
    throw new Error("Check the bill amount");
  }
  return {
    placeId: input.placeId,
    rating: input.rating,
    note: input.note.trim().slice(0, NOTE_MAX),
    listIds: input.listIds,
    visitedAt: input.visitedAt,
    spendCents: input.spendCents,
  };
}

function subscribeToNothing() {
  return () => {};
}

function useHydrated() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}

export function useDiary() {
  const hydrated = useHydrated();
  const visits = useSyncExternalStore(
    visitsStore.subscribe,
    visitsStore.getSnapshot,
    visitsStore.getServerSnapshot,
  );
  const customPlaces = useSyncExternalStore(
    placesStore.subscribe,
    placesStore.getSnapshot,
    placesStore.getServerSnapshot,
  );

  const lastVoided = useSyncExternalStore(
    voidedStore.subscribe,
    voidedStore.getSnapshot,
    voidedStore.getServerSnapshot,
  );

  const places = useMemo(
    () => mergePlaces(SEED_PLACES, customPlaces),
    [customPlaces],
  );

  const addPlace = useCallback(
    (input: NewPlaceInput): Place => {
      const name = input.name.trim();
      if (!name) {
        throw new Error("Place name is required");
      }
      const current = placesStore.getSnapshot();
      const googlePlaceId = input.googlePlaceId?.trim();
      if (googlePlaceId) {
        const existing = current.find(
          (place) =>
            place.googlePlaceId === googlePlaceId || place.id === googlePlaceId,
        );
        if (existing) return existing;
      }
      const merged = mergePlaces(SEED_PLACES, current);
      const baseId = googlePlaceId || slugifyPlaceName(name);
      const id = merged.some((place) => place.id === baseId)
        ? newId("p")
        : baseId;
      const place: Place = {
        id,
        name,
        neighborhood: input.neighborhood?.trim() || METRO,
        cuisine: input.cuisine?.trim() || "other",
        custom: true,
      };
      const address = input.address?.trim();
      if (address) place.address = address;
      if (googlePlaceId) place.googlePlaceId = googlePlaceId;
      if (
        input.lat !== undefined &&
        input.lng !== undefined &&
        Number.isFinite(input.lat) &&
        Number.isFinite(input.lng)
      ) {
        place.lat = input.lat;
        place.lng = input.lng;
      }
      const photoName = input.photoName?.trim();
      if (photoName) place.photoName = photoName;
      const photoAttribution = input.photoAttribution?.trim();
      if (photoAttribution) place.photoAttribution = photoAttribution;
      const photoAttributionUri = input.photoAttributionUri?.trim();
      if (photoAttributionUri) place.photoAttributionUri = photoAttributionUri;
      placesStore.set([...current, place]);
      return place;
    },
    [],
  );

  const logVisit = useCallback((input: NewVisitInput): Visit => {
    const fields = cleanVisitInput(input);
    const visit: Visit = {
      id: newId("v"),
      ...fields,
      createdAt: Date.now(),
    };
    visitsStore.set(sortVisits([visit, ...visitsStore.getSnapshot()]));
    voidedStore.set(null);
    return visit;
  }, []);

  const updateVisit = useCallback(
    (visitId: string, input: NewVisitInput): Visit => {
      const current = visitsStore.getSnapshot();
      const existing = current.find((visit) => visit.id === visitId);
      if (!existing) {
        throw new Error("That check is gone");
      }
      const visit: Visit = {
        ...existing,
        ...cleanVisitInput(input),
        updatedAt: Date.now(),
      };
      visitsStore.set(
        sortVisits(current.map((v) => (v.id === visitId ? visit : v))),
      );
      return visit;
    },
    [],
  );

  /** Removes a visit and holds it for one undo. */
  const voidVisit = useCallback((visitId: string) => {
    const current = visitsStore.getSnapshot();
    const visit = current.find((v) => v.id === visitId);
    if (!visit) return;
    visitsStore.set(current.filter((v) => v.id !== visitId));
    voidedStore.set(visit);
  }, []);

  const undoVoid = useCallback(() => {
    const visit = voidedStore.getSnapshot();
    if (!visit) return;
    const current = visitsStore.getSnapshot();
    if (!current.some((v) => v.id === visit.id)) {
      visitsStore.set(sortVisits([visit, ...current]));
    }
    voidedStore.set(null);
  }, []);

  const dismissVoid = useCallback(() => voidedStore.set(null), []);

  const updateVisitLists = useCallback((visitId: string, listIds: ListId[]) => {
    visitsStore.set(
      visitsStore.getSnapshot().map((visit) =>
        visit.id === visitId ? { ...visit, listIds } : visit,
      ),
    );
  }, []);

  return {
    ready: hydrated,
    visits,
    places,
    addPlace,
    lastVoided,
    logVisit,
    updateVisit,
    voidVisit,
    undoVoid,
    dismissVoid,
    updateVisitLists,
  };
}
