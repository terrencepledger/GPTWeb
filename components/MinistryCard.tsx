import Image from "next/image";
import Link from "next/link";

export type Ministry = {
  name: string;
  description: string;
  image?: string;
  href?: string;
};

export function MinistryCard({ ministry }: { ministry: Ministry }) {
  return (
    <div className="card flex h-full flex-col">
      {ministry.image && (
        <Image
          src={ministry.image}
          alt=""
          width={400}
          height={192}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold">{ministry.name}</h3>
        <p className="mt-2 flex-1 text-sm text-gray-700">
          {ministry.description}
        </p>
        {ministry.href && (
          <Link
            href={ministry.href}
            className="mt-4 text-sm font-medium text-blue-600 hover:underline"
          >
            Learn more
          </Link>
        )}
      </div>
    </div>
  );
}

