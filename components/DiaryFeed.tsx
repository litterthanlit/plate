"use client";

import Link from "next/link";
import { formatCents, formatVisitTime } from "@/lib/diary";
import { PlaceMeta } from "@/components/PlaceMeta";
import { findPlace } from "@/lib/places";
import { useDiary } from "@/lib/use-diary";
import { StarRating } from "@/components/StarRating";
import { ListToggles } from "@/components/ListToggles";

const LINK =
  "text-[10px] uppercase tracking-[0.14em] text-ink/55 hover:text-ink focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink";

function VoidedNotice() {
  const { lastVoided, places, undoVoid, dismissVoid } = useDiary();
  const name = lastVoided
    ? (findPlace(places, lastVoided.placeId)?.name ?? "a visit")
    : null;

  return (
    <div aria-live="polite">
      {lastVoided ? (
        <div className="mb-6 flex items-baseline justify-between gap-3 border border-dashed border-ink/35 px-3 py-2 text-sm">
          <p>
            Voided {name}, {formatVisitTime(lastVoided.visitedAt)}.
          </p>
          <div className="flex shrink-0 gap-4">
            <button
              type="button"
              onClick={undoVoid}
              className={`${LINK} text-ink`}
            >
              Undo
            </button>
            <button
              type="button"
              onClick={dismissVoid}
              aria-label="Dismiss"
              className={LINK}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DiaryFeed() {
  const { ready, visits, places, updateVisitLists } = useDiary();

  if (!ready) {
    return <p className="text-sm text-ink/50">Pulling tickets…</p>;
  }

  if (visits.length === 0) {
    return (
      <>
        <VoidedNotice />
        <div className="space-y-4 text-sm">
          <p>Nothing logged. Go eat, then come back.</p>
          <Link href="/log" className="stamp-btn">
            Log a visit
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <VoidedNotice />
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
              <p className="mt-0.5 text-[11px] text-ink/45">
                {place ? <PlaceMeta place={place} /> : "removed from the book"}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <StarRating
                  value={visit.rating}
                  label={`${visit.rating} stars`}
                />
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
              <div className="mt-2 flex gap-5">
                <Link
                  href={`/diary/${encodeURIComponent(visit.id)}`}
                  className={LINK}
                >
                  Print the check &gt;
                </Link>
                <Link
                  href={`/diary/${encodeURIComponent(visit.id)}/edit`}
                  className={LINK}
                  aria-label={`Edit ${place?.name ?? "visit"}, ${formatVisitTime(visit.visitedAt)}`}
                >
                  Edit
                </Link>
              </div>
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
    </>
  );
}
