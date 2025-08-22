import { notFound } from "next/navigation";

export async function generateMetadata() {
  return { title: "Event" };
}

export default async function Page() {
  notFound();
}
