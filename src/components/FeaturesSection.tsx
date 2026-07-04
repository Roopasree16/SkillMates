import { Users, Zap, Shield, Heart } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Smart Matching",
    description: "AI-powered algorithm connects you with perfect learning partners",
  },
  {
    icon: Zap,
    title: "Instant Connect",
    description: "Swipe to connect with compatible skill exchange partners",
  },
  {
    icon: Shield,
    title: "Verified Skills",
    description: "Take AI-generated quizzes to verify your expertise",
  },
  {
    icon: Heart,
    title: "Build Together",
    description: "Learn, teach, and grow with a community of lifelong learners",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
