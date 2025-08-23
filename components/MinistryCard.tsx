"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

export type Ministry = {
  name: string;
  description: string;
  image?: string;
  href?: string;
};

export function MinistryCard({
  ministry,
  backgroundImage,
  backgroundColor,
}: {
  ministry: Ministry;
  backgroundImage?: string;
  backgroundColor?: string;
}) {
  const style: CSSProperties = {};
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 };
  const animate = { opacity: 1, y: 0 };
  const transition = { duration: shouldReduceMotion ? 0 : 0.3 };
  if (backgroundImage) {
    style.backgroundImage = `url(${backgroundImage})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  if (backgroundColor) {
    style.backgroundColor = backgroundColor;
  }
  return (
    <motion.div
      initial={initial}
      animate={animate}
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      transition={transition}
      className="card relative flex h-full flex-col overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)]"
      style={style}
    >
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
        <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">{ministry.name}</h3>
        <p className="mt-2 flex-1 text-sm text-[var(--brand-fg)]/90">
          {ministry.description}
        </p>
        {ministry.href && (
          <Link
            href={ministry.href}
            className="mt-4 text-sm font-medium text-[var(--brand-accent)] hover:underline hover:text-[var(--brand-primary-contrast)]"
          >
            Learn more
          </Link>
        )}
      </div>
    </motion.div>
  );
}

