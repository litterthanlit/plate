import Link from "next/link";

export default function NotFound() {
  return (
    <div className="table-top flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="receipt w-full max-w-[22rem]">
        <div className="receipt-pad text-center">
          <p className="text-[10px] tracking-[0.14em] text-ink/45">CHK 404</p>
          <h1 className="mt-3 text-xl font-medium tracking-[0.16em]">VOID</h1>
          <p className="mt-3 text-sm text-ink/60">That ticket is not in the pad.</p>
          <Link href="/" className="stamp-btn mt-6">
            Back to the check
          </Link>
        </div>
      </div>
    </div>
  );
}
