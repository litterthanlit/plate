/**
 * Code 39 barcode (digits only). Real encoding, so a phone scanner reads the
 * check number back — the bars are not decoration pretending to be data.
 */
const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  "*": "nwnnwnwnn",
};

const NARROW = 1;
const WIDE = 2.5;

export function Barcode({ value }: { value: string }) {
  const digits = value.replace(/\D/g, "");
  const bars: { x: number; w: number }[] = [];
  let x = 0;

  for (const char of `*${digits}*`) {
    const pattern = CODE39[char];
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === "w" ? WIDE : NARROW;
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    }
    x += NARROW; // inter-character gap
  }

  return (
    <svg
      role="img"
      aria-label={`Barcode ${digits}`}
      viewBox={`0 0 ${x} 40`}
      preserveAspectRatio="none"
      className="thermal-ink block h-11 w-full"
    >
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} width={bar.w} height="40" fill="currentColor" />
      ))}
    </svg>
  );
}
