"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Loader2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { AutomationLog, LogLevel } from "@/lib/automation-logger";
import type { MatchResult } from "@/models/automation.model";
import { getAutomationRunLogs } from "@/actions/automation.actions";

interface RunDetailsDialogProps {
  runId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RunData {
  logs: AutomationLog[] | null;
  matchResults: MatchResult[] | null;
}

const getLevelIcon = (level: LogLevel) => {
  switch (level) {
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
};

const getLevelColor = (level: LogLevel) => {
  switch (level) {
    case "info":    return "text-blue-600";
    case "success": return "text-green-600";
    case "warning": return "text-amber-600";
    case "error":   return "text-red-600";
  }
};

const getLevelBadgeVariant = (level: LogLevel) => {
  switch (level) {
    case "error":   return "destructive" as const;
    case "warning": return "secondary" as const;
    default:        return "default" as const;
  }
};

export function RunDetailsDialog({ runId, open, onOpenChange }: RunDetailsDialogProps) {
  const [data, setData] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<LogLevel | "all">("all");

  useEffect(() => {
    if (!open || !runId) return;
    setLoading(true);
    setData(null);
    getAutomationRunLogs(runId).then((result) => {
      setData(result.success && result.data ? result.data : { logs: null, matchResults: null });
      setLoading(false);
    });
  }, [open, runId]);

  const filteredLogs = data?.logs
    ? logFilter === "all"
      ? data.logs
      : data.logs.filter((l) => l.level === logFilter)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>Run Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading...
          </div>
        ) : (
          <Tabs defaultValue="match" className="flex flex-col flex-1 overflow-hidden px-6 pb-6">
            <TabsList className="shrink-0 w-fit">
              <TabsTrigger value="match">Match Results</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            {/* Match Results tab */}
            <TabsContent value="match" className="flex-1 overflow-hidden mt-4">
              {!data?.matchResults || data.matchResults.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No match data available for this run.</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-center w-20">Score</TableHead>
                        <TableHead className="text-center w-36">Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.matchResults.map((r, i) => (
                        <TableRow
                          key={i}
                          className={
                            r.saved
                              ? "bg-green-50/50 dark:bg-green-950/20"
                              : r.passed
                                ? "bg-amber-50/50 dark:bg-amber-950/20"
                                : ""
                          }
                        >
                          <TableCell className="font-medium">{r.title}</TableCell>
                          <TableCell className="text-muted-foreground">{r.company}</TableCell>
                          <TableCell className="text-center">
                            <span className={r.passed ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                              {r.score}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {r.saved ? (
                              <Badge variant="default" className="gap-1 bg-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Saved
                              </Badge>
                            ) : r.passed ? (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Passed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-muted-foreground">
                                <XCircle className="h-3 w-3" />
                                Below threshold
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Logs tab */}
            <TabsContent value="logs" className="flex flex-col flex-1 overflow-hidden mt-4 gap-3">
              {!data?.logs ? (
                <div className="flex items-center justify-center flex-1 text-muted-foreground">
                  <p>No logs available for this run.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-1 shrink-0">
                    <div className="hidden sm:flex gap-1">
                      {(["all", "info", "success", "warning", "error"] as const).map((level) => (
                        <Button
                          key={level}
                          size="sm"
                          variant={logFilter === level ? "default" : "outline"}
                          onClick={() => setLogFilter(level)}
                          className="capitalize"
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                    <Select
                      value={logFilter}
                      onValueChange={(v) => setLogFilter(v as LogLevel | "all")}
                    >
                      <SelectTrigger className="sm:hidden w-28 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["all", "info", "success", "warning", "error"] as const).map((level) => (
                          <SelectItem key={level} value={level} className="capitalize">
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="flex-1">
                    {filteredLogs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8 text-sm">
                        No logs match the selected filter.
                      </p>
                    ) : (
                      <div className="space-y-2 font-mono text-xs">
                        {[...filteredLogs].reverse().map((log, index) => (
                          <div
                            key={index}
                            className="flex gap-2 p-2 rounded border hover:bg-muted/50"
                          >
                            <div className="flex-shrink-0 pt-0.5">
                              {getLevelIcon(log.level)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-muted-foreground">
                                  {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                                </span>
                                <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                                  {log.level}
                                </Badge>
                              </div>
                              <div className={getLevelColor(log.level)}>{log.message}</div>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
