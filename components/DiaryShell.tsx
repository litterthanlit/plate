"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Barcode } from "@/components/Barcode";
import { Rule, ThermalSheet } from "@/components/ThermalReceipt";
import { usePrintStamp } from "@/lib/use-print-stamp";

const LINKS = [
  { href: "/places", label: "find" },
  { href: "/log", label: "log" },
  { href: "/diary", label: "diary" },
  { href: "/lists", label: "lists" },
  { href: "/backup", label: "backup" },
] as const;

export function DiaryShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const stamp = usePrintStamp();

  return (
    <div className="table-top flex min-h-full flex-1 items-start justify-center px-4 py-8 sm:py-12">
      <ThermalSheet className="w-full max-w-[26rem]">
        <header className="receipt-pad thermal-ink pb-0 text-[12px] leading-[1.55]">
          <div className="text-center">
            <Link
              href="/"
              className="receipt-line print-double text-[1.15rem] font-bold leading-none"
            >
              PLATE
            </Link>
            <p className="thermal-faint mt-2">DIARY FOR MEALS OUT</p>
          </div>

          <Rule double className="mt-3 text-ink/70" />

          <dl className="grid grid-cols-2 uppercase tabular-nums">
            <div className="flex gap-2">
              <dt>CHK</dt>
              <dd>{stamp.check}</dd>
            </div>
            <div className="flex justify-end gap-2">
              <dt className="sr-only">Screen</dt>
              <dd>{title}</dd>
            </div>
            <div className="col-span-2 flex justify-between">
              <dt className="sr-only">Printed</dt>
              <dd>{stamp.date}</dd>
              <dd>{stamp.time}</dd>
            </div>
          </dl>

          <Rule className="text-ink/70" />

          <nav aria-label="Diary">
            <ul className="flex flex-wrap justify-between gap-x-2 gap-y-1 uppercase tracking-[0.08em]">
              {LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`receipt-line -mx-1 block px-1 ${
                        active ? "print-reverse" : "hover:underline hover:underline-offset-2"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Rule className="text-ink/70" />
        </header>

        <div className="receipt-pad pt-5">{children}</div>

        <footer className="receipt-pad thermal-ink pt-0 text-center text-[12px] leading-[1.55]">
          <Rule className="text-ink/70" />
          <p className="mt-2 font-bold">*** THANK YOU ***</p>
          <p className="thermal-faint mt-1">DATA STAYS ON THIS DEVICE</p>
          <div className="mx-auto mt-4 w-4/5">
            <Barcode value={stamp.barcode} />
            <p className="mt-1 tracking-[0.3em] tabular-nums">{stamp.barcode}</p>
          </div>
          <p className="thermal-faint mt-3">CUSTOMER COPY</p>
        </footer>
      </ThermalSheet>
    </div>
  );
}
