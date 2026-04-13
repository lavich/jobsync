import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Automations" };
import { AutomationListServer } from "@/components/automations/AutomationListServer";
import Loading from "@/components/Loading";

export default function AutomationsPage() {
  return (
    <div className="col-span-3">
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>}>
        <AutomationListServer />
      </Suspense>
    </div>
  );
}
