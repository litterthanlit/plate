import Link from "next/link";

const ITEMS = [
  { n: "1", name: "find a place", href: "/places" },
  { n: "1", name: "log a visit", href: "/log" },
  { n: "1", name: "rate + short note", href: "/log" },
  { n: "1", name: "stash on lists", href: "/lists" },
] as const;

export function ReceiptLanding() {
  return (
    <div className="table-top flex min-h-full flex-1 justify-center px-4 py-12 sm:py-20">
      <article
        aria-label="Plate guest check"
        className="receipt w-full max-w-[23rem]"
      >
        <div className="guest-check">
          <header className="text-center">
            <p className="text-[10px] font-medium tracking-[0.18em] text-ink/40">
              GUEST CHECK
            </p>
            <h1 className="mt-4 text-[1.35rem] font-medium leading-none tracking-[0.22em]">
              PLATE
            </h1>
            <p className="mt-2.5 text-[11px] tracking-[0.14em] text-ink/50">
              meals out
            </p>
          </header>

          <div className="mt-10 grid grid-cols-2 gap-y-1 text-[11px] leading-5 tracking-[0.04em] text-ink/55">
            <span>Chk 0041</span>
            <span className="text-right">Tbl 12</span>
            <span>Server: you</span>
            <span className="text-right">Portland</span>
          </div>

          <ul className="mt-8 space-y-2.5">
            {ITEMS.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-baseline text-[14px] leading-[1.65] text-ink/90 hover:text-ink focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="w-5 tabular-nums text-[12px] text-ink/40">
                    {item.n}
                  </span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-3 pl-5 text-[11px] leading-5 tracking-[0.04em] text-ink/40">
            date night / cheap / solo
          </p>

          <div className="mt-9 border-t border-ink/20 pt-4">
            <div className="flex w-full items-baseline text-[13px] leading-6 text-ink/55">
              <span>Sub</span>
              <span className="leader" />
              <span>honest, local</span>
            </div>
            <div className="mt-1.5 flex w-full items-baseline text-[14px] font-medium leading-6">
              <span>Total</span>
              <span className="leader" />
              <span>your taste, nearby</span>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <Link href="/log" className="stamp-btn">
              Start a diary
            </Link>
            <Link
              href="/diary"
              className="block text-center text-[11px] tracking-[0.1em] text-ink/50 hover:text-ink focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Get the app
            </Link>
          </div>

          <p className="mt-10 text-center text-[10px] tracking-[0.12em] text-ink/35">
            thank you
          </p>
          <p className="mt-2 text-center text-[10px] leading-5 tracking-[0.06em] text-ink/35">
            no booking · no delivery
            <br />
            just where you ate
          </p>
        </div>
      </article>
    </div>
  );
}
