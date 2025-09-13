import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        approved: "bg-success/10 text-success-foreground ring-success/30",
        limited: "bg-warning/10 text-warning-foreground ring-warning/30", 
        denied: "bg-destructive/10 text-destructive-foreground ring-destructive/30",
        pending: "bg-muted text-muted-foreground ring-border",
        yellow: "bg-warning/10 text-warning-foreground ring-warning/30",
        red: "bg-destructive/10 text-destructive-foreground ring-destructive/30",
        green: "bg-success/10 text-success-foreground ring-success/30",
      },
    },
    defaultVariants: {
      variant: "pending",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props} />
  );
}

export { StatusBadge, statusBadgeVariants };