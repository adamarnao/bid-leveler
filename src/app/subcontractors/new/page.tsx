"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import SubcontractorForm from "@/components/subcontractors/SubcontractorForm";
import { createEmptySubcontractor } from "@/components/subcontractors/form/subcontractorFormFactories";
import { saveSubcontractor } from "@/lib/subcontractors";
import { getCompanySettings } from "@/lib/settings";
import { Subcontractor } from "@/types/Subcontractor";

export default function NewSubcontractorPage() {
  const router = useRouter();
  const initialSubcontractor = useMemo(
    () => createEmptySubcontractor(getCompanySettings().defaultCsiVersion),
    []
  );

  function createSubcontractor(subcontractor: Subcontractor) {
    saveSubcontractor(subcontractor);
    router.push(`/subcontractors/${subcontractor.id}`);
  }

  return (
    <AppShell title="Add Subcontractor">
      <div className="command-nav">
        <Link href="/subcontractors" className="command-nav-link">
          {"<-"} Back to Subcontractors
        </Link>
      </div>

      <SubcontractorForm
        initialSubcontractor={initialSubcontractor}
        submitLabel="Create Subcontractor"
        onSubmit={createSubcontractor}
      />
    </AppShell>
  );
}
