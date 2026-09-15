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
import { NOTE_MAX, RATING_MAX, RATING_MIN } from "./types";

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

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export type NewPlaceInput = {
  name: string;
  neighborhood?: string;
  cuisine?: string;
};

export type NewVisitInput = {
  placeId: string;
  rating: number;
  note: string;
  listIds: ListId[];
};

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
      const merged = mergePlaces(SEED_PLACES, current);
      const baseId = slugifyPlaceName(name);
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
      placesStore.set([...current, place]);
      return place;
    },
    [],
  );

  const logVisit = useCallback((input: NewVisitInput): Visit => {
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
    const visit: Visit = {
      id: newId("v"),
      placeId: input.placeId,
      rating: input.rating,
      note: input.note.trim().slice(0, NOTE_MAX),
      listIds: input.listIds,
      createdAt: Date.now(),
    };
    visitsStore.set([visit, ...visitsStore.getSnapshot()]);
    return visit;
  }, []);

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
    logVisit,
    updateVisitLists,
  };
}
