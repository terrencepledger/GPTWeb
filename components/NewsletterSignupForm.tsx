"use client";

import { FormEvent, useId, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

type NewsletterSignupFormProps = {
  className?: string;
};

export default function NewsletterSignupForm({ className }: NewsletterSignupFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const feedbackId = useId();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setStatus("error");
      setMessage("Please enter an email address.");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
        cache: "no-store",
      });

      if (response.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing! Please check your inbox for updates.");
        setEmail("");
      } else {
        const data = await response.json().catch(() => null);
        const errorMessage =
          data && typeof data.error === "string"
            ? data.error
            : "We couldn't add you to the newsletter right now. Please try again.";
        setStatus("error");
        setMessage(errorMessage);
      }
    } catch (error) {
      console.error("Newsletter signup request failed", error);
      setStatus("error");
      setMessage("We couldn't reach the server. Please try again soon.");
    }
  };

  const isSubmitting = status === "loading";
  const feedbackMessage = message ? (
    <p
      id={feedbackId}
      role={status === "error" ? "alert" : "status"}
      className={`text-sm ${
        status === "error"
          ? "text-[color-mix(in_oklab,_var(--brand-primary-contrast)_85%,_var(--brand-accent)_15%)]"
          : "text-[var(--brand-accent)]"
      } sm:order-3 sm:basis-full sm:pt-1`}
    >
      {message}
    </p>
  ) : null;

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full flex-col gap-2 sm:flex-row sm:items-center${className ? ` ${className}` : ""}`}
      noValidate
    >
      <input
        type="email"
        name="email"
        placeholder="Email address"
        className="flex-1 rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 py-1 text-[var(--brand-fg)] placeholder-[var(--brand-muted)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={isSubmitting}
        aria-describedby={message ? feedbackId : undefined}
        aria-invalid={status === "error" ? "true" : undefined}
        required
      />
      <button
        type="submit"
        className="cursor-pointer rounded border border-[var(--brand-primary)] bg-[var(--brand-alt)] px-3 py-1 text-sm font-medium text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-contrast)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-accent)] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[var(--brand-primary)] dark:text-[var(--brand-ink)] dark:hover:bg-[var(--brand-alt)] dark:hover:text-[var(--brand-primary)]"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting…" : "Subscribe"}
      </button>
      {feedbackMessage}
    </form>
  );
}
