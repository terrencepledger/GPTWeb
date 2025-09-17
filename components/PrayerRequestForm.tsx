"use client";

import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

type FormValues = {
  name: string;
  email: string;
  request: string;
};

type SubmissionStatus = "idle" | "loading" | "success" | "error";

interface PrayerRequestFormProps {
  pageId?: string;
  formId?: string;
}

const initialValues: FormValues = {
  name: "",
  email: "",
  request: "",
};

export default function PrayerRequestForm({
  pageId,
  formId,
}: PrayerRequestFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    field: keyof FormValues,
  ) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));

      if (status === "error") {
        setStatus("idle");
        setErrorMessage(null);
      }
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status === "loading") {
      return;
    }

    if (!pageId && !formId) {
      setErrorMessage(
        "Form configuration is missing. Please try again later.",
      );
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const payload: Record<string, string> = {
        name: values.name,
        email: values.email,
        request: values.request,
      };

      if (pageId) {
        payload.pageId = pageId;
      } else if (formId) {
        payload.formId = formId;
      }

      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const message =
          data && typeof data.error === "string"
            ? data.error
            : "There was a problem sending your request. Please try again.";
        setErrorMessage(message);
        setStatus("error");
        return;
      }

      setValues(initialValues);
      setStatus("success");
    } catch (error) {
      setErrorMessage(
        "There was a problem sending your request. Please try again.",
      );
      setStatus("error");
    }
  };

  const isLoading = status === "loading";

  return (
    <div className="mt-8 max-w-md mx-auto">
      {status === "success" ? (
        <p className="text-center animate-fade-in-up" role="status">
          Thank you for sharing your request. Our team will be praying with you.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
          <div className="relative">
            <input
              id="prayer-name"
              type="text"
              required
              placeholder="Your name"
              value={values.name}
              onChange={handleChange("name")}
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
              type="email"
              required
              placeholder="Your email"
              value={values.email}
              onChange={handleChange("email")}
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
              required
              rows={5}
              placeholder="Your prayer request"
              value={values.request}
              onChange={handleChange("request")}
              className="peer w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 pt-6 pb-4 placeholder-transparent focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--brand-bg)] transition-colors"
            />
            <label
              htmlFor="prayer-request"
              className="pointer-events-none absolute left-4 top-3 z-[1] bg-[var(--brand-surface)] px-1 origin-[0] -translate-y-1/2 text-sm text-[var(--brand-muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs peer-hover:top-1.5 peer-hover:translate-y-0 peer-hover:text-xs peer-hover:bg-transparent peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[var(--brand-accent)] peer-focus:bg-[var(--brand-surface)]"
            >
              Prayer Request
            </label>
          </div>

          {status === "error" && errorMessage ? (
            <p
              className="text-sm text-center text-[var(--brand-accent)]"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-outline-cta pulse-border-soft w-full inline-flex items-center justify-center gap-2 px-6 py-4 shadow-md hover:shadow-lg transform transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--brand-bg)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isLoading ? "Sending..." : "Send Request"}</span>
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
          </button>
        </form>
      )}
    </div>
  );
}

