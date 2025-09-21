export const metadata = {
  title: "Privacy Policy",
  description:
    "Learn how we collect, use, and protect the personal information you share with our church.",
};

const LAST_UPDATED = "September 21, 2025";

export default function Page() {
  return (
    <section className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-[var(--brand-muted)]">
          Last updated: {LAST_UPDATED}
        </p>
        <p>
          We are committed to protecting your privacy and being transparent about
          how we collect, use, and safeguard the information you share with our
          church through this website and our connected digital channels
          (collectively, the &ldquo;Services&rdquo;). This policy explains what data we
          collect, why we collect it, and the choices available to you.
        </p>
      </header>

      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <p>
            We collect the information you choose to share when you submit
            contact, prayer, volunteer, or event forms, subscribe to updates, or
            request resources. This may include your name, contact details,
            communication preferences, and the message you provide. We also
            gather limited technical data, such as browser type, device
            characteristics, and approximate location based on your IP address,
            to help us understand how people use the Services.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">How We Use and Share Information</h2>
          <p>
            We use your information to respond to your requests, coordinate
            ministry opportunities, send updates you have asked to receive, keep
            the Services secure, and comply with applicable laws. We do not sell
            or rent your personal information.
          </p>
          <p>
            Access to your information is limited to staff and trusted
            volunteers who need it to support our ministries. We may share data
            with service providers who assist us with technology or event tools
            (under agreements that protect your information), comply with legal
            obligations, or provide aggregated insights that do not identify you
            personally.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Data Retention and Security</h2>
          <p>
            We retain personal information only as long as needed for the
            purposes described in this policy or as required by law. We employ
            administrative, technical, and physical safeguards to help protect
            your information, while recognizing that no system can be guaranteed
            completely secure.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Your Choices</h2>
          <p>
            You may contact us to update or correct your details, and every
            email we send includes an unsubscribe link so you can opt out of
            future messages. You can also adjust browser settings to manage
            cookies or other tracking tools, though doing so may affect how the
            Services function on your device.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Children and Policy Updates</h2>
          <p>
            The Services are not directed to children under 13. If we learn that
            information from a child has been provided without verifiable
            parental consent, we will delete it. We may update this policy to
            reflect new practices or requirements, and we will revise the
            &ldquo;Last updated&rdquo; date above whenever that occurs.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Contact Us</h2>
          <p>
            If you have questions about this policy or how your information is
            handled, please reach out through our contact page or by using the
            communication method that is most convenient for you. We are happy
            to clarify our practices and address any concerns.
          </p>
        </div>
      </div>
    </section>
  );
}
