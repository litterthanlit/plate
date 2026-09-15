import { Suspense } from "react";
import { DiaryShell } from "@/components/DiaryShell";
import { LogVisit } from "@/components/LogVisit";

export default function LogPage() {
  return (
    <DiaryShell title="log">
      <Suspense fallback={<p className="text-sm text-ink/50">Opening the pad…</p>}>
        <LogVisit />
      </Suspense>
    </DiaryShell>
  );
}
