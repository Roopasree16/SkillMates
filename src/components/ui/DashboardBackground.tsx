import { cn } from "@/lib/utils";

interface DashboardBackgroundProps {
  variant?: "default" | "profile" | "network" | "resources" | "chat";
  children: React.ReactNode;
  className?: string;
}

/**
 * DashboardBackground provides themed backgrounds for dashboard sections.
 * This is a purely visual enhancement - no functionality is affected.
 */
const DashboardBackground = ({ 
  variant = "default", 
  children, 
  className 
}: DashboardBackgroundProps) => {
  const backgroundClasses = {
    default: "bg-page-network",
    profile: "bg-page-profile",
    network: "bg-page-network",
    resources: "bg-page-resources",
    chat: "bg-page-chat",
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
      {/* Dark overlay for readability - slightly more opaque for dashboard */}
      <div 
        className="fixed inset-0 -z-10 bg-background/88 dark:bg-background/92" 
        aria-hidden="true"
      />
      {/* Content */}
      {children}
    </div>
  );
};

export default DashboardBackground;
