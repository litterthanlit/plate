"use client";

import { useSyncExternalStore } from "react";
import { useDiary } from "./use-diary";

let printedAt: number | null = null;

function subscribeToNothing() {
  return () => {};
}

function getPrintedAt() {
  printedAt ??= Date.now();
  return printedAt;
}

function getServerPrintedAt() {
  return null;
}

const DATE = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "2-digit",
});

const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/**
 * What the printer stamps on the check: when it came off the roll and which
 * check number it is. The check number is your next visit, so it grows with
 * the diary. Server render prints dashes, like a register before sync.
 */
export function usePrintStamp() {
  const { ready, visits } = useDiary();
  const at = useSyncExternalStore(
    subscribeToNothing,
    getPrintedAt,
    getServerPrintedAt,
  );

  const check = String(ready ? visits.length + 1 : 1).padStart(4, "0");

  if (at === null) {
    return { check, date: "--/--/--", time: "--:--", barcode: check };
  }

  const stamp = new Date(at);
  const date = DATE.format(stamp);
  const time = TIME.format(stamp);
  const barcode = `${check}${date.replace(/\D/g, "")}`;
  return { check, date, time, barcode };
}
