"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ContextHelpProps = {
  label: string;
  content: string;
  className?: string;
};

type TooltipPlacement = "above" | "below";

type TooltipPosition = {
  left: number;
  top: number;
  placement: TooltipPlacement;
};

const TOOLTIP_MARGIN = 12;
const TOOLTIP_OFFSET = 8;
const TOOLTIP_MAX_WIDTH = 360;

export default function ContextHelp({ label, content, className }: ContextHelpProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({
    left: 0,
    top: 0,
    placement: "above",
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const isOpen = isPinned || isHovered || isFocused;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(TOOLTIP_MAX_WIDTH, viewportWidth - TOOLTIP_MARGIN * 2);
    const halfTooltipWidth = tooltipWidth / 2;
    const triggerCenter = rect.left + rect.width / 2;
    const left = Math.min(
      Math.max(triggerCenter, TOOLTIP_MARGIN + halfTooltipWidth),
      viewportWidth - TOOLTIP_MARGIN - halfTooltipWidth,
    );
    const hasRoomAbove = rect.top >= 120;
    const placement: TooltipPlacement = hasRoomAbove ? "above" : "below";
    const top =
      placement === "above"
        ? Math.max(TOOLTIP_MARGIN, rect.top - TOOLTIP_OFFSET)
        : Math.min(viewportHeight - TOOLTIP_MARGIN, rect.bottom + TOOLTIP_OFFSET);

    setPosition({ left, top, placement });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();
  }, [content, isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isPinned) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (triggerRef.current?.contains(event.target) || tooltipRef.current?.contains(event.target)) {
        return;
      }

      setIsPinned(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isPinned]);

  return (
    <span
      className={`context-help ${className ?? ""}`}
      data-open={isOpen ? "true" : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className="context-help-trigger"
        aria-label={`More about ${label}`}
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        onClick={() => setIsPinned((currentValue) => !currentValue)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsPinned(false);
            setIsHovered(false);
          }
        }}
      >
        <span aria-hidden="true">?</span>
      </button>
      {typeof document !== "undefined" && isOpen
        ? createPortal(
            <span
              id={tooltipId}
              ref={tooltipRef}
              role="tooltip"
              className={`context-help-popover context-help-popover-visible context-help-popover-${position.placement}`}
              style={{
                left: `${position.left}px`,
                top: `${position.top}px`,
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
