import { cn } from "@/lib/utils";

interface PageBackgroundProps {
  variant?: "default" | "auth" | "profile" | "network" | "resources";
  children: React.ReactNode;
  className?: string;
}

/**
 * PageBackground component provides themed background visuals
 * with proper overlays for readability in both light and dark modes.
 * Does NOT affect any functionality - purely visual enhancement.
 */
const PageBackground = ({ 
  variant = "default", 
  children, 
  className 
}: PageBackgroundProps) => {
  const backgroundClasses = {
    default: "bg-page-default",
    auth: "bg-page-auth",
    profile: "bg-page-profile",
    network: "bg-page-network",
    resources: "bg-page-resources",
  };

  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* Background layer */}
      <div 
        className={cn(
          "fixed inset-0 -z-10",
          backgroundClasses[variant]
        )} 
        aria-hidden="true"
      />
      {/* Dark overlay for readability */}
      <div 
        className="fixed inset-0 -z-10 bg-background/85 dark:bg-background/90" 
        aria-hidden="true"
      />
      {/* Content */}
      {children}
    </div>
  );
};

export default PageBackground;
