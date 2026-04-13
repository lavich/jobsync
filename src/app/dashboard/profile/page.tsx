import type { Metadata } from "next";
import ProfileContainer from "@/components/profile/ProfileContainer";
import React from "react";

export const metadata: Metadata = { title: "Profile" };

function Profile() {
  return (
    <div className="col-span-3">
      <ProfileContainer />
    </div>
  );
}

export default Profile;
