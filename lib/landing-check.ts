import { METRO, SEED_PLACES } from "./places";

/** What the landing check says. The HTML check and the 3D print read this. */
export const LANDING_ITEMS = [
  {
    name: "FIND A PLACE",
    mod: `${SEED_PLACES.length} spots, ${METRO}`,
    href: "/places",
  },
  { name: "LOG A VISIT", mod: "date, time, what it cost", href: "/log" },
  { name: "RATE + SHORT NOTE", mod: "1-5 stars, 140 chars", href: "/log" },
  { name: "STASH ON LISTS", mod: "date night / cheap / solo", href: "/lists" },
] as const;

export const LANDING_TOTALS = [
  { label: "SUBTOTAL", value: "0.00" },
  { label: "BOOKING FEE", value: "NONE" },
  { label: "DELIVERY", value: "NONE" },
  { label: "TAX 0%", value: "0.00" },
] as const;

export const LANDING_CTA = { label: "START A DIARY", href: "/log" } as const;
export const LANDING_OPEN = { label: "OPEN YOUR DIARY >", href: "/diary" } as const;
