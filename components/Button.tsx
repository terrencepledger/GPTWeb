import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "outline-cta";
  glow?: boolean;
};

export default function Button({
  variant = "primary",
  glow = false,
  className,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: "btn-primary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    "outline-cta": "btn-outline-cta",
  }[variant];

  return (
    <button
      className={clsx(variantClass, glow && "pulse-border-soft", className)}
      {...props}
    />
  );
}

