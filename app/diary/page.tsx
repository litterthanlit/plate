import { DiaryFeed } from "@/components/DiaryFeed";
import { DiaryShell } from "@/components/DiaryShell";

export default function DiaryPage() {
  return (
    <DiaryShell title="diary">
      <DiaryFeed />
    </DiaryShell>
  );
}
