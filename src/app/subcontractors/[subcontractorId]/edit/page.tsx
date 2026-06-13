"use client";

import { useEffect, useState } from "react";
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [subcontractor, setSubcontractor] = useState<Subcontractor | undefined>(
    undefined
  );

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) return;

      const storageValue = localStorage.getItem(subcontractorsStorageKey) || "[]";

      setSubcontractor(
        subcontractorId
          ? getSubcontractorById(subcontractorId, storageValue)
          : undefined
      );
      setIsLoaded(true);
    });

    return () => {
      isActive = false;
    };
  }, [subcontractorId]);

  function handleSubmit(updatedSubcontractor: Subcontractor) {
    saveSubcontractor(updatedSubcontractor);
    router.push(`/subcontractors/${updatedSubcontractor.id}`);
  }

  if (!isLoaded) {
    return (
      <AppShell title="Edit Subcontractor">
        <p className="muted-text">Loading subcontractor...</p>
      </AppShell>
    );
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
      <SubcontractorForm
        initialSubcontractor={subcontractor}
        submitLabel="Save Subcontractor"
        onSubmit={handleSubmit}
      />
    </AppShell>
  );
}
