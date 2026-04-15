import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function AutomationsLoading() {
  return (
    <div className="col-span-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Job Discovery Automations</CardTitle>
          <Button variant="outline" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
