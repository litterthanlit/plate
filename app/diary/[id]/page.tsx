import { VisitReceipt } from "@/components/VisitReceipt";

export default async function VisitPage({ params }: PageProps<"/diary/[id]">) {
  const { id } = await params;
  return <VisitReceipt id={id} />;
}
