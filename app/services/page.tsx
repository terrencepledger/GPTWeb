import { redirect } from "next/navigation";
export const metadata = { title: "Services" };
export default function Page() {
  redirect("/livestreams");
}
