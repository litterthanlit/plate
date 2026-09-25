"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { VisitForm } from "@/components/VisitForm";
import { useDiary } from "@/lib/use-diary";

export function LogVisit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, logVisit } = useDiary();

  if (!ready) {
    return <p className="text-sm text-ink/50">Opening the pad…</p>;
  }

  return (
    <VisitForm
      initialPlaceId={searchParams.get("place")}
      submitLabel="Drop the check"
      onSave={logVisit}
      onSaved={(visit) => router.push(`/diary/${encodeURIComponent(visit.id)}`)}
    />
  );
}
