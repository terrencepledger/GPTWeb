import ContactForm from "@/components/ContactForm";
import { contactFormSettings } from "@/lib/queries";

export const metadata = { title: "Contact" };
export default async function Page() {
  const formSettings = await contactFormSettings();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-semibold text-[var(--brand-heading-primary)]">Contact</h1>
        <p className="mx-auto max-w-2xl text-base text-[var(--brand-body-primary)]">
          Get in touch with us using the contact form below.
        </p>
      </div>
      <div className="mx-auto max-w-3xl rounded-3xl border-2 border-[var(--brand-border-strong)] bg-[var(--brand-bg)] p-6 shadow-xl">
        <ContactForm
          pageId={formSettings?.pageId}
          formId={formSettings?.formId}
        />
      </div>
    </div>
  );
}
