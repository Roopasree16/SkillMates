import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: "fade" | "slide-up" | "slide-right" | "scale";
}

const PageTransition = ({ 
  children, 
  className,
  variant = "fade" 
}: PageTransitionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure the animation triggers
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const variants = {
    fade: {
      initial: "opacity-0",
      animate: "opacity-100",
    },
    "slide-up": {
      initial: "opacity-0 translate-y-4",
      animate: "opacity-100 translate-y-0",
    },
    "slide-right": {
      initial: "opacity-0 -translate-x-4",
      animate: "opacity-100 translate-x-0",
    },
    scale: {
      initial: "opacity-0 scale-95",
      animate: "opacity-100 scale-100",
    },
  };

  const currentVariant = variants[variant];

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        isVisible ? currentVariant.animate : currentVariant.initial,
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageTransition;
