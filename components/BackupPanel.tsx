"use client";

import Link from "next/link";
import { useId, useRef, useState, type ChangeEvent } from "react";
import {
  BACKUP_MAX_BYTES,
  backupFilename,
  buildBackup,
  parseBackup,
  planRestore,
  type BackupMode,
  type ParsedBackup,
  type RestorePlan,
} from "@/lib/backup";
import { useDiary } from "@/lib/use-diary";

const LABEL = "mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/55";
const LINK =
  "text-[10px] uppercase tracking-[0.14em] text-ink/55 hover:text-ink focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink";

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function formatDay(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

/** One printed line: label left, figure right, like a check total. */
function Line({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink/60">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Safari needs the URL alive until the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ExportSection() {
  const { visits, customPlaces } = useDiary();
  const [saved, setSaved] = useState(false);
  const empty = visits.length === 0 && customPlaces.length === 0;

  function handleExport() {
    downloadJson(buildBackup(visits, customPlaces), backupFilename());
    setSaved(true);
  }

  return (
    <section aria-labelledby="export-heading" className="space-y-4">
      <div>
        <h2 id="export-heading" className={LABEL}>
          Take a copy
        </h2>
        <p className="text-sm leading-relaxed">
          Your diary lives only in this browser. Download a copy to keep it
          safe or move it to another device.
        </p>
      </div>
      <dl className="space-y-1 text-sm">
        <Line label="visits" value={visits.length} />
        <Line label="saved places" value={customPlaces.length} />
      </dl>
      <button
        type="button"
        onClick={handleExport}
        disabled={empty}
        className="stamp-btn"
      >
        Download copy
      </button>
      <p aria-live="polite" className="text-[10px] text-ink/45">
        {empty
          ? "Nothing to copy yet."
          : saved
            ? `Saved as ${backupFilename()}.`
            : "One .json file. Plain text, readable anywhere."}
      </p>
    </section>
  );
}

function ImportSection() {
  const { visits, customPlaces, restoreBackup } = useDiary();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [backup, setBackup] = useState<ParsedBackup | null>(null);
  const [mode, setMode] = useState<BackupMode>("merge");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ mode: BackupMode; plan: RestorePlan } | null>(
    null,
  );

  const preview = backup
    ? planRestore({ visits, places: customPlaces }, backup, mode)
    : null;

  function reset() {
    setBackup(null);
    setFileName(null);
    setMode("merge");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setDone(null);
    setError(null);
    setBackup(null);
    setMode("merge");
    setFileName(file?.name ?? null);
    if (!file) return;
    if (file.size > BACKUP_MAX_BYTES) {
      setError("Too big to be a Plate copy.");
      return;
    }
    try {
      const parsed = parseBackup(await file.text());
      if (parsed.visits.length === 0 && parsed.places.length === 0) {
        setError("That copy is empty.");
        return;
      }
      setBackup(parsed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't read it.");
    }
  }

  function handleRestore() {
    if (!backup) return;
    try {
      const plan = restoreBackup(backup, mode);
      setDone({ mode, plan });
      reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't restore.");
    }
  }

  return (
    <section aria-labelledby="import-heading" className="space-y-4">
      <div>
        <h2 id="import-heading" className={LABEL}>
          Bring one back
        </h2>
        <p className="text-sm leading-relaxed">
          Load a copy from this or another device. You&apos;ll see what changes
          before anything does.
        </p>
      </div>

      <div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center justify-between gap-3 border border-dashed border-ink/35 px-3 py-3 text-sm hover:border-ink peer-focus-visible:border-ink peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
        >
          <span className="truncate">{fileName ?? "Choose a .json copy"}</span>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-ink/55">
            {fileName ? "Change" : "Browse"}
          </span>
        </label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-stripe">
          {error}
        </p>
      ) : null}

      {backup && preview ? (
        <div className="space-y-4 border-t border-dashed border-ink/25 pt-4">
          <dl className="space-y-1 text-sm">
            {backup.exportedAt !== null ? (
              <Line label="copy from" value={formatDay(backup.exportedAt)} />
            ) : null}
            <Line label="visits in copy" value={backup.visits.length} />
            <Line label="places in copy" value={backup.places.length} />
            {backup.skipped > 0 ? (
              <Line label="unreadable, skipped" value={backup.skipped} />
            ) : null}
          </dl>

          <fieldset>
            <legend className={LABEL}>How</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["merge", "Add to diary"],
                  ["replace", "Replace diary"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center justify-center border px-3 py-2 text-[11px] uppercase tracking-[0.14em] has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                    mode === value
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/30 text-ink/70 hover:border-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="restore-mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => setMode(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="border border-dashed border-ink/35 px-3 py-2 text-sm">
            {mode === "merge" ? (
              <dl className="space-y-1">
                <Line label="new visits" value={preview.added} />
                <Line label="newer edits" value={preview.updated} />
                <Line label="already here" value={preview.unchanged} />
                <Line label="new places" value={preview.placesAdded} />
              </dl>
            ) : (
              <p>
                {preview.dropped > 0 ? (
                  <>
                    <span className="text-stripe">
                      {plural(preview.dropped, "visit")} here not in the copy
                      will be lost.
                    </span>{" "}
                  </>
                ) : null}
                This diary becomes the copy. No undo, so take a copy first if
                unsure.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button type="button" onClick={handleRestore} className="stamp-btn">
              {mode === "merge" ? "Add it in" : "Replace diary"}
            </button>
            <button type="button" onClick={reset} className={LINK}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div aria-live="polite">
        {done ? (
          <div className="flex items-baseline justify-between gap-3 border border-dashed border-ink/35 px-3 py-2 text-sm">
            <p>
              {done.mode === "replace"
                ? `Diary replaced. ${plural(done.plan.visits.length, "visit")} on file.`
                : done.plan.added + done.plan.updated + done.plan.placesAdded === 0
                  ? "Nothing new. Already up to date."
                  : `Added ${plural(done.plan.added, "visit")}, updated ${done.plan.updated}.`}
            </p>
            <Link href="/diary" className={`${LINK} shrink-0 text-ink`}>
              Diary &gt;
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function BackupPanel() {
  const { ready } = useDiary();

  if (!ready) {
    return <p className="text-sm text-ink/50">Counting tickets…</p>;
  }

  return (
    <div className="space-y-8">
      <ExportSection />
      <div className="rule text-ink/30" aria-hidden="true" />
      <ImportSection />
    </div>
  );
}
