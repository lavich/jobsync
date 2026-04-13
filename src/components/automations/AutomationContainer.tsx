"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import type { AutomationWithResume } from "@/models/automation.model";
import { AutomationList } from "./AutomationList";
import { AutomationWizard } from "./AutomationWizard";

interface AutomationContainerProps {
  automations: AutomationWithResume[];
}

export function AutomationContainer({ automations }: AutomationContainerProps) {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editAutomation, setEditAutomation] =
    useState<AutomationWithResume | null>(null);

  const handleEdit = (automation: AutomationWithResume) => {
    setEditAutomation(automation);
    setWizardOpen(true);
  };

  const handleWizardClose = (open: boolean) => {
    setWizardOpen(open);
    if (!open) setEditAutomation(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Job Discovery Automations</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setWizardOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AutomationList
            automations={automations}
            onEdit={handleEdit}
            onRefresh={() => router.refresh()}
          />
        </CardContent>
      </Card>

      <AutomationWizard
        open={wizardOpen}
        onOpenChange={handleWizardClose}
        onSuccess={() => router.refresh()}
        editAutomation={editAutomation}
      />
    </>
  );
}
