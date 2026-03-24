import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center justify-center rounded-full border px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        teal:
          "border-transparent bg-[rgba(13,110,114,0.08)] text-[color:var(--primary-teal)]",
        red:
          "border-transparent bg-[rgba(196,60,63,0.1)] text-[color:var(--primary-red)]",
        success:
          "border-transparent bg-[rgba(47,127,101,0.1)] text-[color:var(--success)]",
        neutral:
          "border-[rgba(23,53,58,0.08)] bg-[rgba(255,255,255,0.82)] text-[color:var(--ink-soft)]",
        dark:
          "border-transparent bg-[rgba(23,53,58,0.88)] text-white",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
