import { BackupPanel } from "@/components/BackupPanel";
import { DiaryShell } from "@/components/DiaryShell";

export default function BackupPage() {
  return (
    <DiaryShell title="backup">
      <BackupPanel />
    </DiaryShell>
  );
}
