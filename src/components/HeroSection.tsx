import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserCount } from "@/hooks/useUserCount";

const HeroSection = () => {
  const { count, loading } = useUserCount();

  const scrollToInfo = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Exchange Skills,{" "}
            <span className="text-gradient">Build Connections</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with people who want to learn what you know, and teach you what 
            you want to learn. Networking, learning, and friendship — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button 
              variant="heroOutline" 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={scrollToInfo}
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-4xl font-bold text-gradient">
                {loading ? "..." : count}
              </span>
              <span className="text-lg">users joined</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">and growing every day</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
