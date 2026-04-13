import type { Metadata } from "next";
import { getJobDetails } from "@/actions/job.actions";
import JobDetails from "@/components/myjobs/JobDetails";
import { BreadcrumbsSetter } from "@/context/BreadcrumbContext";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { job } = await getJobDetails(id);
  return { title: job?.JobTitle?.label ?? "Job Details" };
}

async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { job } = await getJobDetails(id);

  return (
    <div className="col-span-3">
      <BreadcrumbsSetter
        crumbs={[
          { label: "My Jobs", href: "/dashboard/myjobs" },
          { label: job?.JobTitle?.label ?? "Job Details" },
        ]}
      />
      <JobDetails job={job} />
    </div>
  );
}

export default JobDetailsPage;
