"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ui-button focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "ui-button--default",
        secondary: "ui-button--secondary",
        outline: "ui-button--outline",
        ghost: "ui-button--ghost",
        danger: "ui-button--danger",
      },
      size: {
        default: "ui-button--size-default",
        sm: "ui-button--size-sm",
        lg: "ui-button--size-lg",
        icon: "ui-button--size-icon",
      },
      width: {
        auto: "",
        full: "ui-button--full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      width: "auto",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, width, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, width }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
