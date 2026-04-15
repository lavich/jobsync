"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { AutomationWithResume } from "@/models/automation.model";
import { AutomationList } from "./AutomationList";
import { AutomationWizard } from "./AutomationWizard";
import { getAutomationsList } from "@/actions/automation.actions";
import { APP_CONSTANTS } from "@/lib/constants";
import Loading from "../Loading";
import { Skeleton } from "../ui/skeleton";
import { toast } from "../ui/use-toast";
import { RecordsCount } from "../RecordsCount";
import { RecordsPerPageSelector } from "../RecordsPerPageSelector";

export function AutomationContainer() {
  const [automations, setAutomations] = useState<AutomationWithResume[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState<number>(APP_CONSTANTS.RECORDS_PER_PAGE);
  const prevRecordsPerPage = useRef(recordsPerPage);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editAutomation, setEditAutomation] = useState<AutomationWithResume | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadAutomations = useCallback(
    async (page: number) => {
      setLoading(true);
      const { data, total, success, message } = await getAutomationsList(page, recordsPerPage);
      if (success && data) {
        setAutomations((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotal(total ?? 0);
        setPage(page);
      } else {
        toast({ variant: "destructive", title: "Error!", description: message });
      }
      setInitialLoading(false);
      setLoading(false);
    },
    [recordsPerPage],
  );

  const reloadAutomations = useCallback(async () => {
    await loadAutomations(1);
  }, [loadAutomations]);

  useEffect(() => {
    void loadAutomations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevRecordsPerPage.current === recordsPerPage) return;
    prevRecordsPerPage.current = recordsPerPage;
    void loadAutomations(1);
  }, [recordsPerPage, loadAutomations]);

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
          <Button variant="outline" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </CardHeader>
        <CardContent>
          {initialLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <>
              {loading && <Loading />}
              <AutomationList
                automations={automations}
                onEdit={handleEdit}
                onRefresh={reloadAutomations}
              />
              {automations.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <RecordsCount
                    count={automations.length}
                    total={total}
                    label="automations"
                  />
                  {total > APP_CONSTANTS.RECORDS_PER_PAGE && (
                    <RecordsPerPageSelector
                      value={recordsPerPage}
                      onChange={setRecordsPerPage}
                    />
                  )}
                </div>
              )}
              {automations.length < total && (
                <div className="flex justify-center p-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void loadAutomations(page + 1)}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AutomationWizard
        open={wizardOpen}
        onOpenChange={handleWizardClose}
        onSuccess={reloadAutomations}
        editAutomation={editAutomation}
      />
    </>
  );
}
