"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Barcode } from "@/components/Barcode";
import { ReceiptRow, Rule, ThermalReceipt } from "@/components/ThermalReceipt";
import {
  checkNumber,
  formatCents,
  placeTab,
  stars,
} from "@/lib/diary";
import { listLabel } from "@/lib/lists";
import { METRO, findPlace } from "@/lib/places";
import { useDiary } from "@/lib/use-diary";

const DATE = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "2-digit",
});

const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="table-top flex min-h-full flex-1 items-start justify-center px-4 py-12 sm:py-20">
      {children}
    </div>
  );
}

export function VisitReceipt({ id }: { id: string }) {
  const { ready, visits, places } = useDiary();

  if (!ready) {
    return (
      <Page>
        <p className="thermal-ink text-[12px]">PRINTING…</p>
      </Page>
    );
  }

  const visit = visits.find((v) => v.id === id);

  if (!visit) {
    return (
      <Page>
        <ThermalReceipt label="Missing check">
          <div className="text-center">
            <p>CHK ----</p>
            <h1 className="print-double mt-3 text-[1.5rem] font-bold leading-none">
              VOID
            </h1>
            <p className="thermal-faint mt-3">NOT IN THIS DEVICE&apos;S PAD</p>
          </div>
          <Rule className="mt-4" />
          <Link href="/diary" className="stamp-btn mt-4">
            Back to diary
          </Link>
        </ThermalReceipt>
      </Page>
    );
  }

  const place = findPlace(places, visit.placeId);
  const placeName = (place?.name ?? "Unknown place").toUpperCase();
  const check = checkNumber(visits, visit);
  const tab = placeTab(visits, visit);
  const at = new Date(visit.visitedAt);
  const date = DATE.format(at);
  const time = TIME.format(at);
  const spend = visit.spendCents;
  const amount = spend === null ? "--.--" : formatCents(spend);

  return (
    <Page>
      <ThermalReceipt label={`Check for ${place?.name ?? "a visit"} on ${date}`}>
        <header className="text-center">
          <p className="print-double text-[13px] font-bold leading-none">
            PLATE
          </p>
          <h1 className="mt-4 text-[15px] font-bold leading-tight">
            {placeName}
          </h1>
          {place?.address ? (
            <p className="thermal-faint mt-1">{place.address.toUpperCase()}</p>
          ) : (
            <>
              <p className="thermal-faint mt-1">
                {place
                  ? `${place.neighborhood} · ${place.cuisine}`.toUpperCase()
                  : "REMOVED FROM THE BOOK"}
              </p>
              <p className="thermal-faint">{METRO.toUpperCase()}</p>
            </>
          )}
        </header>

        <Rule double className="mt-4" />

        <dl className="grid grid-cols-2 tabular-nums">
          <div className="flex gap-2">
            <dt>CHK</dt>
            <dd>{check}</dd>
          </div>
          <div className="flex justify-end gap-2">
            <dt>SVR</dt>
            <dd>YOU</dd>
          </div>
          <div className="col-span-2 flex justify-between">
            <dt className="sr-only">Visited</dt>
            <dd>
              <time dateTime={at.toISOString()}>{date}</time>
            </dd>
            <dd>{time}</dd>
          </div>
        </dl>

        <Rule className="mt-1" />

        <div className="thermal-faint flex" aria-hidden="true">
          <span className="w-7">QTY</span>
          <span className="flex-1">ITEM</span>
          <span>AMT</span>
        </div>

        <div className="mt-1 flex items-baseline">
          <span className="w-7 tabular-nums">1</span>
          <span className="flex-1 pr-3">MEAL AT {placeName}</span>
          <span className="tabular-nums">{amount}</span>
        </div>
        {visit.note ? (
          <p className="thermal-faint break-words pl-7">&gt; {visit.note}</p>
        ) : null}

        <dl className="mt-2">
          <ReceiptRow
            left="RATING"
            right={
              <span aria-label={`${visit.rating} of 5 stars`}>
                {stars(visit.rating)}
              </span>
            }
          />
          {visit.listIds.length > 0 ? (
            <ReceiptRow
              left="LISTS"
              right={visit.listIds.map(listLabel).join(", ").toUpperCase()}
            />
          ) : null}
        </dl>

        <Rule className="mt-3" />

        <dl>
          <ReceiptRow left="SUBTOTAL" right={amount} />
          <ReceiptRow left="TIP" right="INCL" />
        </dl>

        <Rule double className="mt-1" />

        <dl>
          <ReceiptRow
            left="TOTAL"
            right={spend === null ? "$--.--" : `$${amount}`}
            className="print-double-tall text-[14px] font-bold"
          />
        </dl>
        {spend === null ? (
          <p className="thermal-faint mt-1">&gt; bill not recorded</p>
        ) : null}

        <Rule className="mt-3" />

        <dl>
          <ReceiptRow
            left="VISIT HERE"
            right={`${tab.visitNumber} OF ${tab.visitCount}`}
          />
          {tab.spentToDateCents > 0 ? (
            <ReceiptRow
              left="SPENT HERE TO DATE"
              right={formatCents(tab.spentToDateCents)}
            />
          ) : null}
        </dl>

        <Rule className="mt-3" />

        <div className="mt-4 space-y-3">
          <Link
            href={`/log?place=${encodeURIComponent(visit.placeId)}`}
            className="stamp-btn"
          >
            Log another here
          </Link>
          <Link href="/diary" className="receipt-line block text-center">
            &lt; BACK TO DIARY
          </Link>
        </div>

        <Rule className="mt-4" />

        <footer className="text-center">
          <p className="mt-2 font-bold">*** THANK YOU ***</p>
          <div className="mx-auto mt-4 w-4/5">
            <Barcode value={`${check}${date}`} />
            <p className="mt-1 tracking-[0.3em] tabular-nums">
              {check}
              {date.replace(/\D/g, "")}
            </p>
          </div>
          <p className="thermal-faint mt-4">CUSTOMER COPY</p>
        </footer>
      </ThermalReceipt>
    </Page>
  );
}
