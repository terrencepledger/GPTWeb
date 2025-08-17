import { redirect } from "next/navigation";
export const metadata = { title: "Beliefs" };
export default function Page() {
  redirect("/about/mission-statement");
}
