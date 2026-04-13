import type { Metadata } from "next";
import { getResumeById } from "@/actions/profile.actions";
import ResumeContainer from "@/components/profile/ResumeContainer";
import { BreadcrumbsSetter } from "@/context/BreadcrumbContext";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: resume } = await getResumeById(id);
  return { title: resume?.title ?? "Resume" };
}

async function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: resume } = await getResumeById(id);
  return (
    <div className="col-span-3">
      <BreadcrumbsSetter
        crumbs={[
          { label: "Profile", href: "/dashboard/profile" },
          { label: "Resumes", href: "/dashboard/profile" },
          { label: resume?.title ?? "Resume" },
        ]}
      />
      <ResumeContainer resume={resume} />
    </div>
  );
}

export default ResumePage;
