"use client";

import { useState } from "react";
import Button from "@/components/Button";

export default function Page() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-semibold text-center animate-slide-in-from-top">
        Prayer Requests
      </h1>

      <div className="mt-8 max-w-md mx-auto">
        {submitted ? (
          <p className="text-center animate-fade-in-up">
            Thank you for sharing your request. Our team will be praying with you.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
            <div className="relative">
              <input
                id="prayer-name"
                name="name"
                type="text"
                required
                placeholder="Your name"
                className="peer w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 pt-5 pb-3 placeholder-transparent focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--brand-bg)] transition-colors"
              />
              <label
                htmlFor="prayer-name"
                className="pointer-events-none absolute left-4 top-3 z-[1] bg-[var(--brand-surface)] px-1 origin-[0] -translate-y-1/2 text-sm text-[var(--brand-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs peer-hover:top-1.5 peer-hover:translate-y-0 peer-hover:text-xs peer-hover:bg-transparent peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[var(--brand-accent)] peer-focus:bg-[var(--brand-surface)]"
              >
                Name
              </label>
            </div>

            <div className="relative">
              <input
                id="prayer-email"
                name="email"
                type="email"
                required
                placeholder="Your email"
                className="peer w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 pt-5 pb-3 placeholder-transparent focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--brand-bg)] transition-colors"
              />
              <label
                htmlFor="prayer-email"
                className="pointer-events-none absolute left-4 top-3 z-[1] bg-[var(--brand-surface)] px-1 origin-[0] -translate-y-1/2 text-sm text-[var(--brand-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs peer-hover:top-1.5 peer-hover:translate-y-0 peer-hover:text-xs peer-hover:bg-transparent peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[var(--brand-accent)] peer-focus:bg-[var(--brand-surface)]"
              >
                Email
              </label>
            </div>

            <div className="relative">
              <textarea
                id="prayer-request"
                name="request"
                required
                rows={5}
                placeholder="Your prayer request"
                className="peer w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 pt-6 pb-4 placeholder-transparent focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--brand-bg)] transition-colors"
              />
              <label
                htmlFor="prayer-request"
                className="pointer-events-none absolute left-4 top-3 z-[1] bg-[var(--brand-surface)] px-1 origin-[0] -translate-y-1/2 text-sm text-[var(--brand-muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs peer-hover:top-1.5 peer-hover:translate-y-0 peer-hover:text-xs peer-hover:bg-transparent peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[var(--brand-accent)] peer-focus:bg-[var(--brand-surface)]"
              >
                Prayer Request
              </label>
            </div>

            <Button
              type="submit"
              variant="outline-cta"
              glow
              className="w-full py-4"
            >
              <span>Send Request</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
