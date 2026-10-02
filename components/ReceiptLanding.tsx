"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
} from "react";
import { LandingCheck } from "@/components/LandingCheck";
import type { ReceiptScene } from "@/components/three/receipt-scene";
import type { PrintStamp } from "@/lib/receipt-print";
import { usePrintStamp } from "@/lib/use-print-stamp";

/**
 * "html": server render, no WebGL, or still loading.
 * "3d": the paper is on the table; the HTML check stays for screen readers.
 * "flat": someone asked for (or tabbed into) the plain check.
 */
type Phase = "html" | "3d" | "flat";

const PAPER_MAX_PX = 368; // the HTML check's 23rem
const GUTTER_PX = 16;

function paperWidth() {
  return Math.min(PAPER_MAX_PX, window.innerWidth - GUTTER_PX * 2);
}

function hasWebGL() {
  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"));
  } catch {
    return false;
  }
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

export function ReceiptLanding() {
  const stamp = usePrintStamp();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("html");
  const [stageHeight, setStageHeight] = useState<number | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReceiptScene | null>(null);
  const reprintRef = useRef<((stamp: PrintStamp) => void) | null>(null);
  const stampRef = useRef(stamp);
  const wantsFlat = phase === "flat";

  // Mount the paper once the page is interactive; tear it down for "flat".
  useEffect(() => {
    if (wantsFlat || !hasWebGL()) return;
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let onResize: (() => void) | null = null;

    (async () => {
      const [{ createReceiptScene, STAGE_MARGIN }, { printLandingCheck }] =
        await Promise.all([
          import("@/components/three/receipt-scene"),
          import("@/lib/receipt-print"),
        ]);
      await document.fonts.ready;
      if (cancelled) return;

      const fontFamily = getComputedStyle(document.body).fontFamily;
      const print = (s: PrintStamp) => printLandingCheck(s, fontFamily, 4096);
      let check = print(stampRef.current);
      const sizeStage = () => {
        const px = paperWidth();
        const height = Math.round(px * check.aspect + STAGE_MARGIN * 2);
        host.style.height = `${height}px`;
        setStageHeight(height);
        return px;
      };

      let scene: ReceiptScene;
      try {
        scene = createReceiptScene(host, check, {
          paperPx: sizeStage(),
          reducedMotion: window.matchMedia(REDUCED_MOTION).matches,
          onNavigate: (href) => router.push(href),
          onReady: () => {
            if (!cancelled) setPhase("3d");
          },
        });
      } catch {
        return; // WebGL said yes, then no: stay on the HTML check.
      }
      sceneRef.current = scene;
      reprintRef.current = (s) => {
        check = print(s);
        scene.setCheck(check);
      };
      onResize = () => scene.resize(sizeStage());
      window.addEventListener("resize", onResize);
    })();

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener("resize", onResize);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      reprintRef.current = null;
      host.style.height = "";
    };
  }, [wantsFlat, router]);

  // The stamp settles after hydration (check number, print time): reprint.
  const stampKey = `${stamp.check}|${stamp.date}|${stamp.time}|${stamp.barcode}`;
  useEffect(() => {
    stampRef.current = stamp;
    reprintRef.current?.(stamp);
    // stampKey stands in for the fresh-every-render stamp object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stampKey]);

  // Tabbing into the hidden check means a keyboard user: show it for real.
  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    if (phase === "3d" && event.target.matches(":focus-visible")) {
      setPhase("flat");
    }
  }

  const live = phase === "3d";

  return (
    <div className="table-top relative flex min-h-full flex-1 flex-col items-center overflow-x-clip px-4 py-12 sm:py-20">
      {live ? (
        <p className="flex items-center gap-4 text-[10px] uppercase tracking-[0.16em] text-ink/50">
          <span>Drag the paper · tap a line</span>
          <button
            type="button"
            onClick={() => setPhase("flat")}
            className="receipt-line uppercase text-ink/70 underline underline-offset-2 hover:text-ink"
          >
            Flat copy
          </button>
        </p>
      ) : null}

      {phase !== "flat" ? (
        <div
          ref={hostRef}
          className={`-mx-4 w-screen max-w-none self-center ${
            live
              ? `opacity-100 ${reducedMotion ? "" : "transition-opacity duration-500"}`
              : "pointer-events-none absolute top-0 opacity-0"
          }`}
          style={stageHeight ? { height: stageHeight } : undefined}
        />
      ) : null}

      <div
        onFocus={handleFocus}
        className={live ? "sr-only" : "flex w-full justify-center"}
      >
        <LandingCheck stamp={stamp} />
      </div>

      {phase === "flat" ? (
        <button
          type="button"
          onClick={() => setPhase("html")}
          className="receipt-line mt-6 text-[10px] uppercase tracking-[0.16em] text-ink/60 underline underline-offset-2 hover:text-ink"
        >
          Pick it up
        </button>
      ) : null}
    </div>
  );
}
