"use client";

import { useCallback } from "react";

interface FaqAssistantChipProps {
  prompt?: string;
  label?: string;
  className?: string;
}

const EVENT_NAME = "assistant:open";

export default function FaqAssistantChip({
  prompt,
  label = "Ask the Assistant",
  className = "",
}: FaqAssistantChipProps) {
  const handleClick = useCallback(() => {
    const detail = prompt ? { prompt } : {};
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
    }
  }, [prompt]);

  return (
    <button
      type="button"
      className={`assistant-chip assistant-chip-animate ${className}`.trim()}
      onClick={handleClick}
    >
      <span aria-hidden="true" className="text-lg">💬</span>
      <span>{label}</span>
    </button>
  );
}
