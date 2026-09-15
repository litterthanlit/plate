import type { Place } from "@/lib/types";

export function PlaceMeta({ place }: { place: Place }) {
  if (place.address) {
    return (
      <span className="text-[11px] leading-snug text-ink/50">{place.address}</span>
    );
  }
  return (
    <span className="text-[10px] uppercase tracking-[0.14em] text-ink/45">
      {place.neighborhood} · {place.cuisine}
    </span>
  );
}
