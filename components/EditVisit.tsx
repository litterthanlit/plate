"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { VisitForm } from "@/components/VisitForm";
import { useDiary } from "@/lib/use-diary";

export function EditVisit({ id }: { id: string }) {
  const router = useRouter();
  const { ready, visits, updateVisit } = useDiary();

  if (!ready) {
    return <p className="text-sm text-ink/50">Pulling the ticket…</p>;
  }

  const visit = visits.find((v) => v.id === id);
  const receiptHref = `/diary/${encodeURIComponent(id)}`;

  if (!visit) {
    return (
      <div className="space-y-4 text-sm">
        <p>That check isn&apos;t in this device&apos;s pad.</p>
        <Link href="/diary" className="stamp-btn">
          Back to diary
        </Link>
      </div>
    );
  }

  return (
    <VisitForm
      initial={visit}
      submitLabel="Reprint the check"
      onSave={(input) => updateVisit(visit.id, input)}
      onSaved={() => router.push(receiptHref)}
      secondary={
        <Link
          href={receiptHref}
          className="block text-center text-[11px] uppercase tracking-[0.14em] text-ink/55 hover:text-ink focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Cancel
        </Link>
      }
    />
  );
}
