import Image from "next/image";

export type Staff = {
  name: string;
  role: string;
  email?: string;
  image?: string;
};

export function StaffCard({ staff }: { staff: Staff }) {
  return (
    <div className="card flex h-full flex-col items-center text-center">
      {staff.image && (
        <Image
          src={staff.image}
          alt={staff.name}
          width={400}
          height={400}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{staff.name}</h3>
        <p className="mt-1 text-sm text-gray-600">{staff.role}</p>
        {staff.email && (
          <a
            href={`mailto:${staff.email}`}
            className="mt-2 block text-sm font-medium text-blue-600 hover:underline"
          >
            {staff.email}
          </a>
        )}
      </div>
    </div>
  );
}

