"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const FIVE_MINUTES = 5 * 60 * 1000;

export default function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, FIVE_MINUTES);
    return () => clearInterval(id);
  }, [router]);
  return null;
}

