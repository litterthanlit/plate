"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlaceSearch } from "@/components/PlaceSearch";
import { ListToggles } from "@/components/ListToggles";
import { StarRating } from "@/components/StarRating";
import { findPlace } from "@/lib/places";
import { NOTE_MAX } from "@/lib/types";
import type { ListId, Place } from "@/lib/types";
import { useDiary } from "@/lib/use-diary";

export function LogVisit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, places, addPlace, logVisit } = useDiary();
  const [picked, setPicked] = useState<Place | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [listIds, setListIds] = useState<ListId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const preselectedId = searchParams.get("place");
  const selected =
    picked === undefined
      ? (preselectedId ? (findPlace(places, preselectedId) ?? null) : null)
      : picked;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!selected) {
      setError("Pick a place.");
      return;
    }
    if (rating < 1) {
      setError("Rate it. Honest.");
      return;
    }
    setSaving(true);
    try {
      logVisit({
        placeId: selected.id,
        rating,
        note,
        listIds,
      });
      router.push("/diary");
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save.");
    }
  }

  if (!ready) {
    return <p className="text-sm text-ink/50">Opening the pad…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PlaceSearch
        places={places}
        selected={selected}
        onSelect={setPicked}
        onClear={() => setPicked(null)}
        onCreate={(name) => addPlace({ name })}
      />

      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-ink/55">
          Rate
        </p>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div>
        <label
          htmlFor="note"
          className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-ink/55"
        >
          Short note
        </label>
        <textarea
          id="note"
          value={note}
          maxLength={NOTE_MAX}
          rows={3}
          onChange={(event) => setNote(event.target.value)}
          placeholder="the dumplings, the light, the bill"
          className="w-full resize-none border border-ink/25 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-ink"
        />
        <p className="mt-1 text-right text-[10px] tabular-nums text-ink/40">
          {note.length}/{NOTE_MAX}
        </p>
      </div>

      <ListToggles value={listIds} onChange={setListIds} />

      {error ? <p className="text-sm text-stripe">{error}</p> : null}

      <button type="submit" disabled={saving} className="stamp-btn">
        {saving ? "Saving…" : "Drop the check"}
      </button>
    </form>
  );
}
