import { staffAll } from "@/lib/queries";
import { StaffCard } from "@/components/StaffCard";

export const metadata = { title: "Staff" };

export default async function Page() {
  const staff = await staffAll();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Staff</h1>
      <p className="text-lg text-[var(--brand-muted)]">
        Our ministry team is dedicated to serving the congregation with love and
        humility. Meet the people who help lead our church community.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {staff.map((member) => (
          <StaffCard key={member._id} staff={member} />
        ))}
      </div>
    </div>
  );
}
