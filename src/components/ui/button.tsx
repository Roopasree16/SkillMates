import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 dark:hover:shadow-primary/20",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/20",
        outline: "border border-input bg-background hover:bg-accent/10 hover:text-accent-foreground hover:border-accent dark:hover:bg-accent dark:hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:shadow-md hover:shadow-amber-500/10 dark:hover:bg-secondary/80 dark:hover:shadow-sm",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-to-r from-primary via-[hsl(25,95%,55%)] to-accent text-primary-foreground hover:opacity-90 hover:shadow-xl shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_45px_hsl(var(--primary)/0.4)] font-semibold dark:from-[hsl(263,70%,58%)] dark:via-[hsl(280,80%,50%)] dark:to-[hsl(280,80%,45%)] dark:shadow-[0_0_40px_hsl(263,70%,58%,0.3)] dark:hover:shadow-[0_0_50px_hsl(263,70%,58%,0.4)]",
        heroOutline: "border-2 border-primary/30 bg-transparent text-foreground hover:bg-primary/5 hover:border-primary/50 font-semibold dark:border-border dark:hover:bg-secondary/50 dark:hover:border-primary/30",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
