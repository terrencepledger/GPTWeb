import LogoSpinner from "@/components/LogoSpinner";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--brand-bg)]">
      <LogoSpinner />
    </div>
  );
}
