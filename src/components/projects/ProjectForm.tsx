"use client";

import { useState } from "react";
import { CsiMasterFormatVersion } from "@/types/Csi";
import { MarketSector, Project, ProjectStatus } from "@/types/Project";
import { projectClassification } from "@/data/projectClassification";

type ProjectFormProps = {
  initialProject: Project;
  submitLabel: string;
  onSubmit: (project: Project) => void;
};

export default function ProjectForm({
  initialProject,
  submitLabel,
  onSubmit,
}: ProjectFormProps) {
  const [projectNumber, setProjectNumber] = useState(
    initialProject.projectNumber ?? ""
  );
  const [name, setName] = useState(initialProject.name);
  const [client, setClient] = useState(initialProject.client);
  const [estimator, setEstimator] = useState(initialProject.estimator ?? "");

  const [marketSector, setMarketSector] = useState<MarketSector>(
    initialProject.marketSector
  );
  const categoryOptions = Object.keys(projectClassification[marketSector]);
  const [projectCategory, setProjectCategory] = useState(
    initialProject.projectCategory
  );
  const subtypeOptions =
    projectClassification[marketSector][projectCategory] ?? [];
  const [projectSubtype, setProjectSubtype] = useState(
    initialProject.projectSubtype
  );

  const [address, setAddress] = useState(initialProject.address);
  const [city, setCity] = useState(initialProject.city);
  const [stateValue, setStateValue] = useState(initialProject.state);
  const [zip, setZip] = useState(initialProject.zip);

  const [squareFootage, setSquareFootage] = useState(
    formatOptionalNumber(initialProject.squareFootage)
  );
  const [projectDurationMonths, setProjectDurationMonths] = useState(
    formatOptionalNumber(initialProject.projectDurationMonths)
  );

  const [deliveryMethod, setDeliveryMethod] = useState(
    initialProject.deliveryMethod ?? ""
  );
  const [ownershipType, setOwnershipType] = useState(
    initialProject.ownershipType ?? ""
  );

  const [planLink, setPlanLink] = useState(initialProject.planLink ?? "");
  const [documentNotes, setDocumentNotes] = useState(
    initialProject.documentNotes ?? ""
  );

  const [subcontractorBidDueDate, setSubcontractorBidDueDate] = useState(
    initialProject.subcontractorBidDueDate ?? ""
  );
  const [bidReviewDate, setBidReviewDate] = useState(
    initialProject.bidReviewDate ?? ""
  );
  const [bidDueDate, setBidDueDate] = useState(initialProject.bidDueDate);

  const [status, setStatus] = useState<ProjectStatus>(initialProject.status);
  const [csiVersion, setCsiVersion] = useState<CsiMasterFormatVersion>(
    initialProject.csiVersion
  );

  function handleSectorChange(value: MarketSector) {
    const firstCategory = Object.keys(projectClassification[value])[0];
    const firstSubtype = projectClassification[value][firstCategory][0];

    setMarketSector(value);
    setProjectCategory(firstCategory);
    setProjectSubtype(firstSubtype);
  }

  function handleCategoryChange(value: string) {
    const firstSubtype = projectClassification[marketSector][value][0];

    setProjectCategory(value);
    setProjectSubtype(firstSubtype);
  }

  function submitProject(event: React.FormEvent) {
    event.preventDefault();

    onSubmit({
      ...initialProject,
      projectNumber,
      name,
      client,
      estimator,
      marketSector,
      projectCategory,
      projectSubtype,
      address,
      city,
      state: stateValue,
      zip,
      squareFootage: toNumber(squareFootage),
      projectDurationMonths: toNumber(projectDurationMonths),
      deliveryMethod,
      ownershipType,
      planLink,
      documentNotes,
      subcontractorBidDueDate,
      bidReviewDate,
      bidDueDate,
      status,
      csiVersion,
    });
  }

  return (
    <form onSubmit={submitProject}>
      <div style={grid}>
        <section style={panel}>
          <h2>Project Information</h2>

          <Field
            label="Project Number"
            value={projectNumber}
            onChange={setProjectNumber}
          />

          <Field label="Project Name" value={name} onChange={setName} />
          <Field label="Client" value={client} onChange={setClient} />
          <Field label="Estimator" value={estimator} onChange={setEstimator} />
        </section>

        <section style={panel}>
          <h2>Project Classification</h2>

          <Select
            label="Market Sector"
            value={marketSector}
            onChange={(value) => handleSectorChange(value as MarketSector)}
            options={Object.keys(projectClassification)}
          />

          <Select
            label="Project Category"
            value={projectCategory}
            onChange={handleCategoryChange}
            options={categoryOptions}
          />

          <Select
            label="Project Subtype"
            value={projectSubtype}
            onChange={setProjectSubtype}
            options={subtypeOptions}
          />
        </section>

        <section style={panel}>
          <h2>Location</h2>

          <Field label="Address" value={address} onChange={setAddress} />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="State" value={stateValue} onChange={setStateValue} />
          <Field label="Zip" value={zip} onChange={setZip} />
        </section>

        <section style={panel}>
          <h2>Project Details</h2>

          <Field
            label="Square Footage"
            value={squareFootage}
            onChange={setSquareFootage}
            inputMode="numeric"
          />

          <Field
            label="Project Duration (Months)"
            value={projectDurationMonths}
            onChange={setProjectDurationMonths}
            inputMode="numeric"
          />

          <Select
            label="Delivery Method"
            value={deliveryMethod}
            onChange={setDeliveryMethod}
            options={[
              "",
              "Design-Bid-Build",
              "Design-Build",
              "CMAR",
              "Negotiated",
              "Hard Bid",
            ]}
          />

          <Select
            label="Ownership Type"
            value={ownershipType}
            onChange={setOwnershipType}
            options={["", "Private", "Public", "Federal", "State", "Municipal"]}
          />
        </section>

        <section style={panel}>
          <h2>Bid / CSI Setup</h2>

          <Select
            label="Bid Status"
            value={status}
            onChange={(value) => setStatus(value as ProjectStatus)}
            options={[
              "PLAN_REVIEW",
              "BIDDING",
              "SUBMITTED",
              "AWARDED",
              "NOT_AWARDED",
              "ARCHIVED",
            ]}
          />

          <div style={field}>
            <label>
              Subcontractor Bid Due Date
              <br />
              <input
                type="date"
                value={subcontractorBidDueDate}
                onChange={(e) => setSubcontractorBidDueDate(e.target.value)}
                style={input}
              />
            </label>
          </div>

          <div style={field}>
            <label>
              Bid Review Date
              <br />
              <input
                type="date"
                value={bidReviewDate}
                onChange={(e) => setBidReviewDate(e.target.value)}
                style={input}
              />
            </label>
          </div>

          <div style={field}>
            <label>
              Bid Due Date
              <br />
              <input
                type="date"
                value={bidDueDate}
                onChange={(e) => setBidDueDate(e.target.value)}
                style={input}
              />
            </label>
          </div>

          <Select
            label="CSI MasterFormat"
            value={csiVersion}
            onChange={(value) => setCsiVersion(value as CsiMasterFormatVersion)}
            options={["MASTERFORMAT_CURRENT", "MASTERFORMAT_1995"]}
          />
        </section>

        <section style={panelWide}>
          <h2>Documents</h2>

          <Field label="Plan Link" value={planLink} onChange={setPlanLink} />

          <TextArea
            label="Document Notes"
            value={documentNotes}
            onChange={setDocumentNotes}
          />
        </section>
      </div>

      <button type="submit" style={submitButton}>
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div style={field}>
      <label>
        {label}
        <br />
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={input}
        />
      </label>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div style={field}>
      <label>
        {label}
        <br />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={input}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option || "Select..."}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={field}>
      <label>
        {label}
        <br />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...input, minHeight: 100, resize: "vertical" }}
        />
      </label>
    </div>
  );
}

function toNumber(value: string): number | undefined {
  const cleanedValue = value.replace(/,/g, "").trim();

  if (!cleanedValue) return undefined;

  const numberValue = Number(cleanedValue);

  if (Number.isNaN(numberValue)) return undefined;

  return numberValue;
}

function formatOptionalNumber(value: number | undefined): string {
  return value === undefined ? "" : value.toString();
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(300px, 1fr))",
  gap: 16,
  alignItems: "start",
};

const panel: React.CSSProperties = {
  border: "1px solid #555",
  padding: 16,
  borderRadius: 8,
};

const panelWide: React.CSSProperties = {
  ...panel,
  gridColumn: "1 / -1",
};

const field: React.CSSProperties = {
  marginBottom: 12,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 8,
  marginTop: 4,
  color: "black",
  backgroundColor: "gray",
};

const submitButton: React.CSSProperties = {
  padding: "10px 16px",
  marginTop: 16,
  cursor: "pointer",
};
