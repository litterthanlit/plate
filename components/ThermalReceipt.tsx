import type { ReactNode } from "react";
import { ThermalPaperFx } from "@/components/ThermalPaperFx";

/**
 * One thermal check torn off the roll: serrated edges, paper surface,
 * single-density ink. The landing page and every visit print on this.
 */
export function ThermalReceipt({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="receipt-feed w-full max-w-[23rem]">
      <article aria-label={label} className="thermal-check">
        <ThermalPaperFx />
        <div className="guest-check thermal-ink text-[12px] leading-[1.55]">
          {children}
        </div>
      </article>
    </div>
  );
}

/** Printed character rule: `----` or `====`. */
export function Rule({
  double = false,
  className = "",
}: {
  double?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`rule ${double ? "rule--double" : ""} ${className}`}
      aria-hidden="true"
    />
  );
}

/** `LABEL ........ VALUE`. Render inside a <dl>. */
export function ReceiptRow({
  left,
  right,
  className = "",
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline ${className}`}>
      <dt className="shrink-0">{left}</dt>
      <span className="leader" aria-hidden="true" />
      <dd className="text-right tabular-nums">{right}</dd>
    </div>
  );
}
