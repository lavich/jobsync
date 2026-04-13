import type { Metadata } from "next";
import TasksPageClient from "./TasksPageClient";

export const metadata: Metadata = { title: "Tasks" };
import { getAllActivityTypes } from "@/actions/activity.actions";
import { getActivityTypesWithTaskCounts } from "@/actions/task.actions";
import React from "react";

async function Tasks() {
  const [activityTypes, activityTypesWithCounts] = await Promise.all([
    getAllActivityTypes(),
    getActivityTypesWithTaskCounts(),
  ]);

  return (
    <TasksPageClient
      activityTypes={activityTypes || []}
      activityTypesWithCounts={activityTypesWithCounts?.data || []}
      totalTasks={activityTypesWithCounts?.totalTasks || 0}
    />
  );
}

export default Tasks;
