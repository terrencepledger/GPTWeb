import { NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/googleCalendar";

export async function GET() {
  const events = await getCalendarEvents();
  return NextResponse.json(events);
}
