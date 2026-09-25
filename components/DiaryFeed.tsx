"use client";

import Link from "next/link";
import { formatCents, formatVisitTime } from "@/lib/diary";
import { findPlace } from "@/lib/places";
import { useDiary } from "@/lib/use-diary";
import { StarRating } from "@/components/StarRating";
import { ListToggles } from "@/components/ListToggles";

export function DiaryFeed() {
  const { ready, visits, places, updateVisitLists } = useDiary();

  if (!ready) {
    return <p className="text-sm text-ink/50">Pulling tickets…</p>;
  }

  if (visits.length === 0) {
    return (
      <div className="space-y-4 text-sm">
        <p>Nothing logged. Go eat, then come back.</p>
        <Link href="/log" className="stamp-btn">
          Log a visit
        </Link>
      </div>
    );
  }

  return (
    <ol className="space-y-6">
      {visits.map((visit) => {
        const place = findPlace(places, visit.placeId);
        return (
          <li
            key={visit.id}
            className="border-b border-dashed border-ink/20 pb-5 last:border-b-0 last:pb-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-medium">
                <Link
                  href={`/diary/${encodeURIComponent(visit.id)}`}
                  className="hover:underline hover:underline-offset-2 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {place?.name ?? "Unknown place"}
                </Link>
              </h2>
              <time
                dateTime={new Date(visit.visitedAt).toISOString()}
                className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-ink/45"
              >
                {formatVisitTime(visit.visitedAt)}
              </time>
            </div>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink/45">
              {place
                ? `${place.neighborhood} · ${place.cuisine}`
                : "removed from the book"}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <StarRating value={visit.rating} label={`${visit.rating} stars`} />
              {visit.spendCents !== null ? (
                <span className="text-sm tabular-nums">
                  ${formatCents(visit.spendCents)}
                </span>
              ) : null}
            </div>
            {visit.note ? (
              <p className="mt-2 text-sm leading-relaxed">{visit.note}</p>
            ) : (
              <p className="mt-2 text-sm text-ink/40">No note.</p>
            )}
            <Link
              href={`/diary/${encodeURIComponent(visit.id)}`}
              className="mt-2 inline-block text-[10px] uppercase tracking-[0.14em] text-ink/55 hover:text-ink focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Print the check &gt;
            </Link>
            <div className="mt-3">
              <ListToggles
                value={visit.listIds}
                onChange={(next) => updateVisitLists(visit.id, next)}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
