"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mt-8 max-w-md mx-auto">
      {submitted ? (
        <p className="text-center animate-fade-in-up">
          Thanks for reaching out! We&apos;ll get back to you soon.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 animate-fade-in-up"
        >
          <div className="relative">
            <input
              id="name"
              type="text"
              required
              placeholder="Your name"
              className="peer w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 placeholder-transparent focus:border-[var(--brand-primary)] focus:outline-none focus:ring-0 transition-colors"
            />
            <label
              htmlFor="name"
              className="pointer-events-none absolute left-4 top-3 origin-[0] -translate-y-1/2 text-sm text-[var(--brand-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-[var(--brand-primary)]"
            >
              Name
            </label>
          </div>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              placeholder="Your email"
              className="peer w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 placeholder-transparent focus:border-[var(--brand-primary)] focus:outline-none focus:ring-0 transition-colors"
            />
            <label
              htmlFor="email"
              className="pointer-events-none absolute left-4 top-3 origin-[0] -translate-y-1/2 text-sm text-[var(--brand-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-[var(--brand-primary)]"
            >
              Email
            </label>
          </div>
          <div className="relative">
            <textarea
              id="message"
              required
              rows={4}
              placeholder="Your message"
              className="peer w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 placeholder-transparent focus:border-[var(--brand-primary)] focus:outline-none focus:ring-0 transition-colors"
            />
            <label
              htmlFor="message"
              className="pointer-events-none absolute left-4 top-3 origin-[0] -translate-y-1/2 text-sm text-[var(--brand-muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-[var(--brand-primary)]"
            >
              Message
            </label>
          </div>
          <button
            type="submit"
            className="btn-primary w-full transform transition-transform hover:scale-105 active:scale-95"
          >
            Send Message
          </button>
        </form>
      )}
    </div>
  );
}

