"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import SubcontractorForm from "@/components/subcontractors/SubcontractorForm";
import {
  getSubcontractorById,
  saveSubcontractor,
  subcontractorsStorageKey,
} from "@/lib/subcontractors";
import { Subcontractor } from "@/types/Subcontractor";

export default function EditSubcontractorPage() {
  const params = useParams();
  const router = useRouter();
  const rawSubcontractorId = params.subcontractorId;
  const subcontractorId = Array.isArray(rawSubcontractorId)
    ? rawSubcontractorId[0]
    : rawSubcontractorId;
  const storageValue =
    typeof window === "undefined"
      ? "[]"
      : localStorage.getItem(subcontractorsStorageKey) || "[]";
  const subcontractor = subcontractorId
    ? getSubcontractorById(subcontractorId, storageValue)
    : undefined;

  function handleSubmit(updatedSubcontractor: Subcontractor) {
    saveSubcontractor(updatedSubcontractor);
    router.push(`/subcontractors/${updatedSubcontractor.id}`);
  }

  if (!subcontractor) {
    return (
      <AppShell title="Subcontractor Not Found">
        <h1>Subcontractor Not Found</h1>
        <p>Requested subcontractor ID: {subcontractorId}</p>
        <Link href="/subcontractors">Back to Subcontractors</Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Edit ${subcontractor.companyName}`}>
      <Link href={`/subcontractors/${subcontractor.id}`}>
        {"<-"} Back to Profile
      </Link>

      <SubcontractorForm
        initialSubcontractor={subcontractor}
        submitLabel="Save Subcontractor"
        onSubmit={handleSubmit}
      />
    </AppShell>
  );
}
