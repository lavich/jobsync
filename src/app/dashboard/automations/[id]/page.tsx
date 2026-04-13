import type { Metadata } from "next";
import { Suspense } from "react";
import { AutomationDetailServer } from "@/components/automations/AutomationDetailServer";
import Loading from "@/components/Loading";
import { getAutomationById } from "@/actions/automation.actions";
import { BreadcrumbsSetter } from "@/context/BreadcrumbContext";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: automation } = await getAutomationById(id);
  return { title: automation?.name ?? "Automation" };
}

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: automation } = await getAutomationById(id);

  return (
    <div className="col-span-3">
      <BreadcrumbsSetter
        crumbs={[
          { label: "Automations", href: "/dashboard/automations" },
          { label: automation?.name ?? "Automation" },
        ]}
      />
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>}>
        <AutomationDetailServer id={id} />
      </Suspense>
    </div>
  );
}
