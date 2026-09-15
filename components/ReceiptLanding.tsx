import Link from "next/link";

const ITEMS = [
  { n: "1", name: "find a place", href: "/places" },
  { n: "1", name: "log a visit", href: "/log" },
  { n: "1", name: "rate + short note", href: "/log" },
  { n: "1", name: "stash on lists", href: "/lists" },
] as const;

export function ReceiptLanding() {
  return (
    <div className="table-top flex min-h-full flex-1 justify-center px-4 py-10 sm:py-16">
      <article className="receipt w-full max-w-[24.5rem]">
        <div className="receipt-stripe" aria-hidden />
        <div className="receipt-pad relative">
          <header className="text-center">
            <p className="text-[10px] tracking-[0.35em] text-ink/55">
              ★ GUEST CHECK ★
            </p>
            <h1 className="mt-3 text-[2.35rem] font-semibold leading-none tracking-[0.42em]">
              PLATE
            </h1>
            <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-ink/60">
              meals out
            </p>
          </header>

          <div className="mt-6 grid grid-cols-2 gap-y-1 border-y border-dashed border-ink/35 py-3 text-[11px] uppercase tracking-[0.16em] text-ink/70">
            <span>Chk 0041</span>
            <span className="text-right">Tbl 12</span>
            <span>Server: you</span>
            <span className="text-right">Portland</span>
          </div>

          <ul className="mt-5 space-y-3">
            {ITEMS.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-baseline gap-2 text-[15px] hover:text-ink"
                >
                  <span className="w-4 tabular-nums text-ink/50">{item.n}</span>
                  <span className="capitalize">{item.name}</span>
                  <span className="leader" />
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-2 pl-6 text-[11px] uppercase tracking-[0.14em] text-ink/45">
            date night / cheap / solo
          </p>

          <div className="mt-6 border-t-2 border-double border-ink/70 pt-3">
            <div className="flex items-baseline gap-2 text-sm">
              <span className="uppercase tracking-[0.16em] text-ink/55">
                Sub
              </span>
              <span className="leader" />
              <span>honest, local</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2 text-base font-semibold">
              <span className="uppercase tracking-[0.16em]">Total</span>
              <span className="leader" />
              <span>your taste, nearby</span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link href="/log" className="stamp-btn">
              Start a diary
            </Link>
            <Link
              href="/diary"
              className="block text-center text-[11px] uppercase tracking-[0.22em] text-ink/60 hover:text-ink"
            >
              Get the app
            </Link>
          </div>

          <p className="mt-8 text-center text-[10px] uppercase tracking-[0.22em] text-ink/40">
            *** thank you ***
          </p>
          <p className="mt-2 text-center text-[10px] leading-5 tracking-[0.12em] text-ink/40">
            no booking · no delivery
            <br />
            just where you ate
          </p>

          <div className="barcode mt-6" aria-hidden />
          <p className="mt-2 text-center font-mono text-[10px] tracking-[0.28em] text-ink/40">
            0041 1209 1526
          </p>
        </div>
      </article>
    </div>
  );
}
