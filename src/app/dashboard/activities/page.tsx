import type { Metadata } from "next";
import ActivitiesContainer from "@/components/activities/ActivitiesContainer";
import React from "react";

export const metadata: Metadata = { title: "Activities" };

function Activities() {
  return (
    <div className="col-span-3">
      <ActivitiesContainer />
    </div>
  );
}

export default Activities;
