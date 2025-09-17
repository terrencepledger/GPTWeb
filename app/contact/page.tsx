import ContactForm from "@/components/ContactForm";
import { contactFormSettings } from "@/lib/queries";

export const metadata = { title: "Contact" };
export default async function Page() {
  const formSettings = await contactFormSettings();

  return (
    <div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Contact</h1>
        <p className="mt-2 text-sm text-[var(--brand-muted)]">
          Get in touch with us using the contact form below.
        </p>
      </div>
      <ContactForm
        pageId={formSettings?.pageId}
        formId={formSettings?.formId}
      />
    </div>
  );
}
