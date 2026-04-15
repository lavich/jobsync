import type { Metadata } from "next";
import { AutomationContainer } from "@/components/automations/AutomationContainer";

export const metadata: Metadata = { title: "Automations" };

export default function AutomationsPage() {
  return (
    <div className="col-span-3">
      <AutomationContainer />
    </div>
  );
}
