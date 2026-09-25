import { DiaryShell } from "@/components/DiaryShell";
import { EditVisit } from "@/components/EditVisit";

export default async function EditVisitPage({
  params,
}: PageProps<"/diary/[id]/edit">) {
  const { id } = await params;
  return (
    <DiaryShell title="edit">
      <EditVisit id={id} />
    </DiaryShell>
  );
}
