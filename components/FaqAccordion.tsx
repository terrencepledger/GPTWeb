"use client";

import { PortableText } from "@portabletext/react";
import { type ReactNode, useMemo, useState } from "react";
import type { FaqItem } from "@/lib/queries";
import FaqAssistantChip from "./FaqAssistantChip";

interface FaqAccordionProps {
  faqs: FaqItem[];
}

const portableTextComponents = {
  block: {
    normal: ({ children }: { children: ReactNode }) => (
      <p className="text-sm leading-relaxed text-[var(--brand-alt)]/90">{children}</p>
    ),
    h4: ({ children }: { children: ReactNode }) => (
      <h4 className="text-base font-semibold text-[var(--brand-alt)]">{children}</h4>
    ),
  },
  list: {
    bullet: ({ children }: { children: ReactNode }) => (
      <ul className="ml-4 list-disc space-y-1 text-sm text-[var(--brand-alt)]/90">{children}</ul>
    ),
    number: ({ children }: { children: ReactNode }) => (
      <ol className="ml-4 list-decimal space-y-1 text-sm text-[var(--brand-alt)]/90">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }: { children: ReactNode }) => (
      <strong className="font-semibold text-[var(--brand-alt)]">{children}</strong>
    ),
    em: ({ children }: { children: ReactNode }) => (
      <em className="italic text-[var(--brand-alt)]/95">{children}</em>
    ),
    link: ({
      children,
      value,
    }: {
      children: ReactNode;
      value: { href?: string };
    }) => {
      const href = value?.href;
      const isExternal = href?.startsWith("http");
      if (!href) return <>{children}</>;
      return (
        <a
          href={href}
          className="underline decoration-[var(--brand-alt)] underline-offset-2 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-alt)]"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
  },
};

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const groupedFaqs = useMemo(() => {
    const groups = new Map<string, FaqItem[]>();
    faqs.forEach((faq) => {
      const key = faq.category?.trim() || "General";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(faq);
    });
    return Array.from(groups.entries());
  }, [faqs]);

  const toggle = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (faqs.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 text-center text-[var(--brand-alt)]">
        We update our frequently asked questions often. Please check back soon.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {groupedFaqs.map(([category, items]) => (
        <section key={category} aria-labelledby={`faq-category-${category}`} className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id={`faq-category-${category}`}
              className="text-xl font-semibold text-[var(--brand-alt)]"
            >
              {category}
            </h2>
            <span className="text-xs uppercase tracking-widest text-[var(--brand-muted)]">
              {items.length} {items.length === 1 ? "topic" : "topics"}
            </span>
          </div>
          <div className="space-y-4">
            {items.map((faq) => {
              const isOpen = openItems.includes(faq._id);
              const contentId = `faq-answer-${faq._id}`;
              const prompt =
                faq.assistantPrompt?.trim() ||
                `Can you help me with the FAQ titled \"${faq.question}\"?`;

              return (
                <article
                  key={faq._id}
                  className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm transition-transform duration-300 hover:translate-y-[-2px] hover:shadow-lg"
                >
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 text-left"
                      onClick={() => toggle(faq._id)}
                      aria-expanded={isOpen}
                      aria-controls={contentId}
                    >
                      <span className="text-base font-semibold text-[var(--brand-alt)]">
                        {faq.question}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`transition-transform duration-300 ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      >
                        <svg
                          className="h-5 w-5 text-[var(--brand-alt)]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-[color:color-mix(in_oklab,var(--brand-primary)_30%,transparent)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--brand-alt)]/90">
                        {category}
                      </span>
                      <FaqAssistantChip prompt={prompt} />
                    </div>
                  </div>
                  <div
                    id={contentId}
                    className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="mt-3 space-y-3 overflow-hidden">
                      <PortableText value={faq.answer} components={portableTextComponents} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
