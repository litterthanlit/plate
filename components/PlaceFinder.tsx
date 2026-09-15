"use client";

import { useRouter } from "next/navigation";
import { PlaceAutocomplete } from "@/components/PlaceAutocomplete";
import { useDiary } from "@/lib/use-diary";

export function PlaceFinder() {
  const router = useRouter();
  const { ready, places, addPlace } = useDiary();

  if (!ready) {
    return <p className="text-sm text-ink/50">Flipping the book…</p>;
  }

  return (
    <PlaceAutocomplete
      places={places}
      addPlace={addPlace}
      onPick={(place) => {
        router.push(`/log?place=${encodeURIComponent(place.id)}`);
      }}
    />
  );
}
