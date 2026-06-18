"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";

export default function NewSubcontractorPage() {
  const [companyName, setCompanyName] = useState("");
  const [trade, setTrade] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function submitForm(event: React.FormEvent) {
    event.preventDefault();

    const subcontractorApplication = {
      companyName,
      trade,
      contactName,
      email,
      phone,
    };

    console.log("Subcontractor application:", subcontractorApplication);

    alert("Subcontractor application captured. Database connection comes next.");
  }

  return (
    <AppShell title="Add Subcontractor">
      <div style={{ maxWidth: 700 }}>
        <h1>New Subcontractor Application</h1>
        <p>Use this form to add or prequalify a subcontractor.</p>

        <form onSubmit={submitForm}>
          <div style={{ marginBottom: 12 }}>
            <label>
              Company Name
              <br />
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Trade
              <br />
              <input value={trade} onChange={(e) => setTrade(e.target.value)} />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Contact Name
              <br />
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Email
              <br />
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Phone
              <br />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>

          <button type="submit">Submit Application</button>
        </form>
      </div>
    </AppShell>
  );
}
