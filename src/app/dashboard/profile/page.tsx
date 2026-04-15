import type { Metadata } from "next";
import ProfileContainer from "@/components/profile/ProfileContainer";
import { getResumeList } from "@/actions/profile.actions";
import { getCoverLetterList } from "@/actions/coverLetter.actions";
import { APP_CONSTANTS } from "@/lib/constants";
import React from "react";

export const metadata: Metadata = { title: "Profile" };

async function Profile() {
  const [resumeResult, coverLetterResult] = await Promise.all([
    getResumeList(1, APP_CONSTANTS.RECORDS_PER_PAGE),
    getCoverLetterList(1, 100),
  ]);

  return (
    <div className="col-span-3">
      <ProfileContainer
        initialResumes={resumeResult.data ?? []}
        initialTotalResumes={resumeResult.total ?? 0}
        initialCoverLetters={coverLetterResult.data ?? []}
        initialTotalCoverLetters={coverLetterResult.total ?? 0}
      />
    </div>
  );
}

export default Profile;
