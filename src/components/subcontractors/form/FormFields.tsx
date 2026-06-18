import {
  formatPhoneInput,
  formatOptionalNumber,
  toOptionalNumber,
} from "@/components/subcontractors/form/subcontractorFormNormalization";

type FormInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "text" | "search" | "email" | "tel" | "url" | "none" | "numeric" | "decimal";
  className?: string;
  maxLength?: number;
  suffix?: string;
  required?: boolean;
};

export function FormInput({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  className,
  maxLength,
  suffix,
  required = false,
}: FormInputProps) {
  const shouldFormatPhone = isPhoneInputLabel(label);
  const displayValue = shouldFormatPhone ? formatPhoneInput(value) : value;
  const fieldClassName = ["form-field", className].filter(Boolean).join(" ");

  return (
    <div className={fieldClassName}>
      <label>
        {label}
        <br />
        <span className={suffix ? "input-affix-shell" : undefined}>
          <input
            type={type}
            inputMode={inputMode ?? (shouldFormatPhone ? "tel" : undefined)}
            value={displayValue}
            required={required}
            maxLength={maxLength}
            onChange={(event) =>
              onChange(
                shouldFormatPhone
                  ? formatPhoneInput(event.target.value)
                  : event.target.value
              )
            }
            className="form-input"
          />
          {suffix && <span className="input-affix-suffix">{suffix}</span>}
        </span>
      </label>
    </div>
  );
}

type FormTextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function FormTextArea({
  label,
  value,
  onChange,
}: FormTextAreaProps) {
  return (
    <div className="form-field">
      <label>
        {label}
        <br />
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="form-input"
          rows={4}
        />
      </label>
    </div>
  );
}

type FormSelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  getOptionLabel?: (value: string) => string;
};

export function FormSelect({
  label,
  value,
  options,
  onChange,
  getOptionLabel = defaultOptionLabel,
}: FormSelectProps) {
  return (
    <div className="form-field">
      <label>
        {label}
        <br />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="form-input"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function CheckboxField({
  label,
  checked,
  onChange,
  disabled = false,
}: CheckboxFieldProps) {
  return (
    <div className="form-field">
      <label className="radio-option">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        {label}
      </label>
    </div>
  );
}

type VpiInputProps = {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
};

export function VpiInput({ label, value, onChange }: VpiInputProps) {
  return (
    <FormInput
      label={label}
      type="number"
      value={formatOptionalNumber(value)}
      onChange={(inputValue) => onChange(toOptionalNumber(inputValue))}
    />
  );
}

function defaultOptionLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function isPhoneInputLabel(label: string) {
  const normalizedLabel = label.toLowerCase();

  return (
    normalizedLabel.includes("phone") &&
    !normalizedLabel.includes("extension") &&
    normalizedLabel !== "primary phone"
  );
}
