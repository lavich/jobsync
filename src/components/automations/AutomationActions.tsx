"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  MoreHorizontal,
  Pause,
  Play,
  Pencil,
  Trash2,
  PlayCircle,
  Loader2,
} from "lucide-react";
import type { AutomationWithResume } from "@/models/automation.model";
import {
  pauseAutomation,
  resumeAutomation,
  deleteAutomation,
} from "@/actions/automation.actions";

interface AutomationActionsProps {
  automation: AutomationWithResume;
  onEdit: () => void;
  onRefresh: () => void;
  onAfterDelete?: () => void;
  showDelete?: boolean;
  variant?: "dropdown" | "responsive";
}

export function AutomationActions({
  automation,
  onEdit,
  onRefresh,
  onAfterDelete,
  showDelete = false,
  variant = "dropdown",
}: AutomationActionsProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [runNowLoading, setRunNowLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resumeMissing = !automation.resume;
  const isLoading = actionLoading || runNowLoading;

  const handlePauseResume = async () => {
    setActionLoading(true);
    const result =
      automation.status === "active"
        ? await pauseAutomation(automation.id)
        : await resumeAutomation(automation.id);
    setActionLoading(false);
    if (result.success) {
      toast({ title: automation.status === "active" ? "Automation paused" : "Automation resumed" });
      onRefresh();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleRunNow = async () => {
    setRunNowLoading(true);
    try {
      const response = await fetch(`/api/automations/${automation.id}/run`, { method: "POST" });
      const data = await response.json();
      if (response.ok && data.success) {
        toast({ title: "Automation run started", description: `Saved ${data.run.jobsSaved} new jobs` });
        onRefresh();
      } else {
        toast({ title: "Error", description: data.message || "Failed to run automation", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to run automation", variant: "destructive" });
    }
    setRunNowLoading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAutomation(automation.id);
    setIsDeleting(false);
    setShowDeleteDialog(false);
    if (result.success) {
      toast({ title: "Automation deleted" });
      (onAfterDelete ?? onRefresh)();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const pauseResumeItem = (
    <DropdownMenuItem onClick={handlePauseResume} disabled={actionLoading || resumeMissing}>
      {automation.status === "active" ? (
        <Pause className="h-4 w-4 mr-2" />
      ) : (
        <Play className="h-4 w-4 mr-2" />
      )}
      {automation.status === "active" ? "Pause" : "Resume"}
    </DropdownMenuItem>
  );

  const runNowItem = (
    <DropdownMenuItem
      onClick={handleRunNow}
      disabled={runNowLoading || resumeMissing || automation.status === "paused"}
    >
      <PlayCircle className="h-4 w-4 mr-2" />
      Run Now
    </DropdownMenuItem>
  );

  const menuContent = (
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={onEdit}>
        <Pencil className="h-4 w-4 mr-2" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {pauseResumeItem}
      {runNowItem}
      {showDelete && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );

  const deleteDialog = (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Automation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this automation? This action cannot be
            undone. Discovered jobs will remain but lose their automation reference.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "responsive") {
    return (
      <>
        <div className="hidden sm:flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handlePauseResume}
            disabled={actionLoading || resumeMissing}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : automation.status === "active" ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {automation.status === "active" ? "Pause" : "Resume"}
          </Button>
          <Button
            variant="outline"
            onClick={handleRunNow}
            disabled={runNowLoading || resumeMissing || automation.status === "paused"}
          >
            {runNowLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            Run Now
          </Button>
          {showDelete && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            {menuContent}
          </DropdownMenu>
        </div>

        {showDelete && deleteDialog}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        {menuContent}
      </DropdownMenu>

      {showDelete && deleteDialog}
    </>
  );
}
