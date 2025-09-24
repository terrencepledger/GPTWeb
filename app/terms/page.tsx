export const metadata = {
  title: "Terms of Use",
  description:
    "Understand the guidelines that govern how you use our website, online content, and digital ministries.",
};

const LAST_UPDATED = "September 21, 2025";

export default function Page() {
  return (
    <section className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold">Terms of Use</h1>
        <p className="text-sm text-[var(--brand-muted)]">
          Last updated: {LAST_UPDATED}
        </p>
        <p>
          These Terms of Use (&ldquo;Terms&rdquo;) explain the rules that apply to your
          access to and use of this website and any related online experiences
          provided by our church (collectively, the &ldquo;Services&rdquo;). By visiting or
          using the Services, you agree to abide by these Terms. If you do not
          agree, please discontinue use of the Services.
        </p>
      </header>

      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Acceptance and Scope</h2>
          <p>
            By accessing the Services, you agree to these Terms and our Privacy
            Policy. The Services are offered to help people engage with our
            church community and are intended for individuals who are at least
            13 years old or who are using them with the involvement of a parent
            or guardian. If you disagree with any part of these Terms, please do
            not use the Services.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Community Expectations</h2>
          <p>
            We ask every visitor to help maintain a respectful, lawful, and
            secure environment. You agree not to:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Share content that is unlawful, harassing, or harmful.</li>
            <li>Disrupt, damage, or attempt to gain unauthorized access to the Services.</li>
            <li>Provide false information or misuse any registrations, forms, or credentials.</li>
          </ul>
          <p>
            When you submit information, please keep it accurate and up to date.
            You are responsible for safeguarding any login details provided to
            you and for activity that occurs under your credentials.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Content and Third-Party Resources</h2>
          <p>
            Unless otherwise noted, the materials on the Services belong to the
            church. You may access them for personal, non-commercial use and
            need our written permission for any other use. We may include links
            to third-party websites or tools for your convenience. Those
            resources are governed by their own terms and policies, which we do
            not control.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Disclaimers and Limitation of Liability</h2>
          <p>
            The Services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
            We do our best to offer accurate, helpful information, but we make no
            warranties about the Services and disclaim all implied warranties to
            the fullest extent permitted by law. To the extent allowed, the
            church, its staff, volunteers, and agents are not liable for indirect
            or consequential damages, and any direct liability is limited to the
            amount you paid us, if any, to use the Services in the twelve months
            before the claim.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Changes and Contact</h2>
          <p>
            We may update these Terms from time to time and will revise the
            &ldquo;Last updated&rdquo; date above when we do. Continued use of the Services
            after changes are posted means you accept the revised Terms. If you
            have questions, please reach out through our contact page or by
            calling the church office.
          </p>
        </div>
      </div>
    </section>
  );
}
