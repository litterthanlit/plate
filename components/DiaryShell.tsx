"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/places", label: "find" },
  { href: "/log", label: "log" },
  { href: "/diary", label: "diary" },
  { href: "/lists", label: "lists" },
] as const;

export function DiaryShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="table-top flex min-h-full flex-1 justify-center px-4 py-8 sm:py-12">
      <div className="receipt w-full max-w-[26rem]">
        <header className="receipt-pad border-b border-dashed border-ink/30 pb-4">
          <div className="flex items-baseline justify-between">
            <Link href="/" className="text-lg font-semibold tracking-[0.35em]">
              PLATE
            </Link>
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/55">
              {title}
            </span>
          </div>
          <nav
            aria-label="Diary"
            className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em]"
          >
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "border-b border-ink pb-0.5 text-ink"
                      : "text-ink/50 hover:text-ink"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <div className="receipt-pad pt-5">{children}</div>
      </div>
    </div>
  );
}
