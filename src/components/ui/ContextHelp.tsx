"use client";

import { useId, useState } from "react";

type ContextHelpProps = {
  label: string;
  content: string;
  className?: string;
};

export default function ContextHelp({ label, content, className }: ContextHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className={`context-help ${className ?? ""}`} data-open={isOpen ? "true" : undefined}>
      <button
        type="button"
        className="context-help-trigger"
        aria-label={`More about ${label}`}
        aria-describedby={tooltipId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
      >
        <span aria-hidden="true">?</span>
      </button>
      <span id={tooltipId} role="tooltip" className="context-help-popover">
        {content}
      </span>
    </span>
  );
}
