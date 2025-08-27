import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact" };
export default function Page() {
  return (
    <div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Contact</h1>
        <p className="mt-2 text-sm text-[var(--brand-muted)]">
          Get in touch with us using the contact form below.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
