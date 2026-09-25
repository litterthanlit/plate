"use client";

import Link from "next/link";
import { Barcode } from "@/components/Barcode";
import { ReceiptRow, Rule, ThermalReceipt } from "@/components/ThermalReceipt";
import { METRO, SEED_PLACES } from "@/lib/places";
import { usePrintStamp } from "@/lib/use-print-stamp";

const ITEMS = [
  {
    name: "FIND A PLACE",
    mod: `${SEED_PLACES.length} spots, ${METRO}`,
    href: "/places",
  },
  { name: "LOG A VISIT", mod: "date, time, what it cost", href: "/log" },
  { name: "RATE + SHORT NOTE", mod: "1-5 stars, 140 chars", href: "/log" },
  { name: "STASH ON LISTS", mod: "date night / cheap / solo", href: "/lists" },
] as const;

const TOTALS = [
  { label: "SUBTOTAL", value: "0.00" },
  { label: "BOOKING FEE", value: "NONE" },
  { label: "DELIVERY", value: "NONE" },
  { label: "TAX 0%", value: "0.00" },
] as const;

export function ReceiptLanding() {
  const stamp = usePrintStamp();

  return (
    <div className="table-top flex min-h-full flex-1 items-start justify-center px-4 py-12 sm:py-20">
      <ThermalReceipt label="Plate guest check">
        <header className="text-center">
          <h1 className="print-double text-[1.5rem] font-bold leading-none">
            PLATE
          </h1>
          <p className="mt-3">DIARY FOR MEALS OUT</p>
          <p className="thermal-faint">PORTLAND, OR · EST. 2026</p>
          <p className="thermal-faint">DATA STAYS ON THIS DEVICE</p>
        </header>

        <Rule double className="mt-4" />

        <dl className="grid grid-cols-2 tabular-nums">
          <div className="flex gap-2">
            <dt>CHK</dt>
            <dd>{stamp.check}</dd>
          </div>
          <div className="flex justify-end gap-2">
            <dt>TBL</dt>
            <dd>12</dd>
          </div>
          <div className="flex gap-2">
            <dt>SVR</dt>
            <dd>YOU</dd>
          </div>
          <div className="flex justify-end gap-2">
            <dt>GST</dt>
            <dd>1</dd>
          </div>
          <div className="col-span-2 flex justify-between">
            <dt className="sr-only">Printed</dt>
            <dd>{stamp.date}</dd>
            <dd>{stamp.time}</dd>
          </div>
        </dl>

        <Rule className="mt-1" />

        <div className="flex thermal-faint" aria-hidden="true">
          <span className="w-7">QTY</span>
          <span className="flex-1">ITEM</span>
          <span>AMT</span>
        </div>

        <ul className="mt-1 space-y-1">
          {ITEMS.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="receipt-line group flex items-baseline"
              >
                <span className="w-7 tabular-nums">1</span>
                <span className="flex-1 group-hover:underline group-hover:underline-offset-2">
                  {item.name}
                </span>
                <span className="tabular-nums">0.00</span>
              </Link>
              {item.mod ? (
                <p className="thermal-faint pl-7">&gt; {item.mod}</p>
              ) : null}
            </li>
          ))}
        </ul>

        <Rule className="mt-3" />

        <dl>
          {TOTALS.map((row) => (
            <ReceiptRow key={row.label} left={row.label} right={row.value} />
          ))}
        </dl>

        <Rule double className="mt-1" />

        <dl>
          <ReceiptRow
            left="TOTAL"
            right="$0.00"
            className="print-double-tall text-[14px] font-bold"
          />
          <ReceiptRow left="YOU GET" right="YOUR TASTE, NEARBY" className="mt-1" />
        </dl>

        <Rule className="mt-3" />

        <div className="mt-4 space-y-3">
          <Link href="/log" className="stamp-btn">
            Start a diary
          </Link>
          <Link href="/diary" className="receipt-line block text-center">
            OPEN YOUR DIARY &gt;
          </Link>
        </div>

        <Rule className="mt-4" />

        <footer className="text-center">
          <p className="mt-2 font-bold">*** THANK YOU ***</p>
          <p className="mt-1 thermal-faint">
            NO BOOKING · NO DELIVERY
            <br />
            JUST WHERE YOU ATE
          </p>
          <div className="mx-auto mt-5 w-4/5">
            <Barcode value={stamp.barcode} />
            <p className="mt-1 tracking-[0.3em] tabular-nums">
              {stamp.barcode}
            </p>
          </div>
          <p className="mt-4 thermal-faint">CUSTOMER COPY</p>
        </footer>
      </ThermalReceipt>
    </div>
  );
}
