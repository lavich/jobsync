import { Suspense } from "react";
import { AutomationDetailServer } from "@/components/automations/AutomationDetailServer";
import Loading from "@/components/Loading";

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="col-span-3 py-6">
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>}>
        <AutomationDetailServer id={id} />
      </Suspense>
    </div>
  );
}
