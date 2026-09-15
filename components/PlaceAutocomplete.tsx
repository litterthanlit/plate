"use client";

import { useEffect, useMemo, useState } from "react";
import { PlaceMeta } from "@/components/PlaceMeta";
import { PoweredByGoogle } from "@/components/PoweredByGoogle";
import { isSavedPlace, METRO, searchPlaces } from "@/lib/places";
import {
  isPlaceSuggestion,
  type AutocompleteResponse,
  type PlaceDetailsResponse,
  type PlaceSuggestion,
} from "@/lib/places-api";
import type { Place } from "@/lib/types";
import type { NewPlaceInput } from "@/lib/use-diary";

type PlaceAutocompleteProps = {
  places: Place[];
  addPlace: (input: NewPlaceInput) => Place;
  onPick: (place: Place) => void;
  autoFocus?: boolean;
};

function newSessionToken(): string {
  return crypto.randomUUID();
}

export function PlaceAutocomplete({
  places,
  addPlace,
  onPick,
  autoFocus = true,
}: PlaceAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [session, setSession] = useState(newSessionToken);
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/places/status", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          setGoogleEnabled(false);
          return;
        }
        const body = (await response.json()) as { enabled?: unknown };
        setGoogleEnabled(body.enabled === true);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setGoogleEnabled(false);
      });
    return () => controller.abort();
  }, []);

  const catalog = useMemo(() => {
    if (googleEnabled) return places.filter(isSavedPlace);
    return places;
  }, [googleEnabled, places]);

  const localResults = useMemo(
    () => searchPlaces(catalog, query),
    [catalog, query],
  );

  useEffect(() => {
    if (googleEnabled !== true) return;
    const needle = query.trim();
    if (needle.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      const params = new URLSearchParams({
        q: needle,
        session,
      });
      fetch(`/api/places/autocomplete?${params.toString()}`, {
        signal: controller.signal,
        cache: "no-store",
      })
        .then(async (response) => {
          const body = (await response.json()) as AutocompleteResponse;
          if (body.enabled === false) {
            setGoogleEnabled(false);
            setSuggestions([]);
            return;
          }
          if (!response.ok) {
            setSuggestions([]);
            return;
          }
          const known = new Set<string>();
          for (const place of places) {
            known.add(place.id);
            if (place.googlePlaceId) known.add(place.googlePlaceId);
          }
          setSuggestions(
            (body.suggestions ?? []).filter(
              (suggestion) =>
                isPlaceSuggestion(suggestion) && !known.has(suggestion.placeId),
            ),
          );
        })
        .catch((caught: unknown) => {
          if (caught instanceof DOMException && caught.name === "AbortError") {
            return;
          }
          setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [googleEnabled, places, query, session]);

  const needle = query.trim();
  const googleHits =
    googleEnabled === true && needle.length >= 2 ? suggestions : [];
  const canAdd =
    needle.length > 0 &&
    !places.some((place) => place.name.toLowerCase() === needle.toLowerCase());
  const showGoogleCredit = googleEnabled === true && needle.length >= 2;
  const emptyLocal = localResults.length === 0;
  const emptyGoogle = googleHits.length === 0;
  const showSearching = googleEnabled === true && needle.length >= 2 && searching;
  const nothing = emptyLocal && emptyGoogle && !showSearching;
  const showList =
    localResults.length > 0 ||
    googleHits.length > 0 ||
    showSearching ||
    (needle.length > 0 && nothing);

  async function pickGoogle(suggestion: PlaceSuggestion) {
    const existing = places.find(
      (place) =>
        place.googlePlaceId === suggestion.placeId ||
        place.id === suggestion.placeId,
    );
    if (existing) {
      setSession(newSessionToken());
      setQuery("");
      setSuggestions([]);
      onPick(existing);
      return;
    }

    setPicking(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        placeId: suggestion.placeId,
        session,
      });
      const response = await fetch(`/api/places/details?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await response.json()) as PlaceDetailsResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error || "Could not load that place.");
      }
      const place = addPlace({
        name: body.name,
        address: body.address,
        neighborhood: body.neighborhood,
        cuisine: body.cuisine,
        googlePlaceId: body.placeId,
        lat: body.lat,
        lng: body.lng,
        photoName: body.photoName,
        photoAttribution: body.photoAttribution,
        photoAttributionUri: body.photoAttributionUri,
      });
      setSession(newSessionToken());
      setQuery("");
      setSuggestions([]);
      onPick(place);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load that place.",
      );
    } finally {
      setPicking(false);
    }
  }

  if (googleEnabled === null) {
    return <p className="text-sm text-ink/50">Looking around…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50">
        {googleEnabled ? `${METRO} · real places` : `${METRO} · nearby`}
      </p>
      <input
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setError(null);
        }}
        placeholder={
          googleEnabled ? "search a place or address" : "search a place"
        }
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={picking}
        className="w-full border border-ink/25 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-ink"
      />
      {googleEnabled && needle.length === 0 ? (
        <p className="text-sm text-ink/50">
          Type a restaurant, bar, or cafe. Portland first.
        </p>
      ) : null}
      {canAdd ? (
        <button
          type="button"
          disabled={picking}
          onClick={() => {
            const place = addPlace({ name: needle });
            setQuery("");
            onPick(place);
          }}
          className="w-full border border-dashed border-ink/35 px-3 py-2 text-left text-sm hover:bg-paper-2"
        >
          Add “{needle}” then log it
        </button>
      ) : null}
      {showList ? (
        <ul className="divide-y divide-ink/10 border-y border-ink/15">
          {localResults.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                disabled={picking}
                onClick={() => {
                  setQuery("");
                  onPick(place);
                }}
                className="flex w-full items-baseline justify-between gap-3 py-2.5 text-left hover:bg-paper-2"
              >
                <span>
                  <span className="block">{place.name}</span>
                  <PlaceMeta place={place} />
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                  log →
                </span>
              </button>
            </li>
          ))}
          {googleHits.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                disabled={picking}
                onClick={() => {
                  void pickGoogle(suggestion);
                }}
                className="flex w-full items-baseline justify-between gap-3 py-2.5 text-left hover:bg-paper-2"
              >
                <span>
                  <span className="block">{suggestion.name}</span>
                  <span className="text-[11px] leading-snug text-ink/50">
                    {suggestion.address}
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                  {picking ? "…" : "log →"}
                </span>
              </button>
            </li>
          ))}
          {showSearching ? (
            <li className="py-3 text-sm text-ink/50">Checking Google…</li>
          ) : null}
          {nothing && needle.length > 0 ? (
            <li className="py-3 text-sm text-ink/50">No places match.</li>
          ) : null}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-stripe">{error}</p> : null}
      {showGoogleCredit ? <PoweredByGoogle /> : null}
    </div>
  );
}
