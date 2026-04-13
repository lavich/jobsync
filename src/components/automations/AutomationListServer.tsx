import { getAutomationsList } from "@/actions/automation.actions";
import { AutomationContainer } from "./AutomationContainer";

export async function AutomationListServer() {
  const result = await getAutomationsList();
  const automations = result.success && result.data ? result.data : [];
  return <AutomationContainer automations={automations} />;
}
