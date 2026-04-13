import type { Metadata } from "next";
import AdminTabsContainer from "@/components/admin/AdminTabsContainer";

export const metadata: Metadata = { title: "Administration" };

async function AdminPage() {
  return (
    <div className="flex flex-col col-span-3">
      <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
        Administration
      </h3>
      <AdminTabsContainer />
    </div>
  );
}

export default AdminPage;
