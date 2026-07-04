import { Handshake, BookOpen, Globe } from "lucide-react";

const aboutFeatures = [
  {
    icon: Handshake,
    title: "Mutual Exchange",
    description: "Learn what you want while teaching what you know. A true skill barter system where everyone benefits.",
  },
  {
    icon: BookOpen,
    title: "Verified Expertise",
    description: "AI-powered quizzes verify skills before matching, ensuring quality learning experiences for everyone.",
  },
  {
    icon: Globe,
    title: "Global Community",
    description: "Connect with learners worldwide. Schedule video calls, chat, and share resources with your skill partners.",
  },
];

const matchPercentages = [
  {
    range: "80-100%",
    label: "Perfect match! You can teach and learn multiple skills from each other.",
    color: "bg-match-high",
  },
  {
    range: "50-79%",
    label: "Good match with some overlapping skills for exchange.",
    color: "bg-match-medium",
  },
  {
    range: "Below 50%",
    label: "Limited overlap, but still potential for specific skill exchange.",
    color: "bg-match-low",
  },
];

const AboutSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            About SkillMates
          </h2>
          <p className="text-muted-foreground text-lg">
            A peer-to-peer skill exchange platform where learning meets connection
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {aboutFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center p-8 rounded-xl border border-border bg-card animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-secondary mx-auto mb-6 flex items-center justify-center">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Match Percentage Section */}
        <div className="bg-card rounded-2xl border border-border p-8">
          <h3 className="text-xl font-semibold text-foreground text-center mb-4">
            How Match Percentage Works
          </h3>
          <p className="text-muted-foreground text-center mb-8">
            Our smart matching algorithm calculates compatibility based on skill overlap
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {matchPercentages.map((item, index) => (
              <div
                key={item.range}
                className={`p-4 rounded-xl ${item.color}/20 border border-${item.color}/30`}
              >
                <div className={`text-2xl font-bold mb-2`} style={{ 
                  color: index === 0 ? 'hsl(142 70% 45%)' : index === 1 ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)'
                }}>
                  {item.range}
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
