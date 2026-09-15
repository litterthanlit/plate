import { DiaryShell } from "@/components/DiaryShell";
import { PlaceFinder } from "@/components/PlaceFinder";

export default function PlacesPage() {
  return (
    <DiaryShell title="find">
      <PlaceFinder />
    </DiaryShell>
  );
}
