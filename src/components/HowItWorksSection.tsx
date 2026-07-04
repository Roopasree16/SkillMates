const steps = [
  {
    number: 1,
    title: "Create Your Profile",
    description: "Share your background, what you can teach, and what you want to learn",
  },
  {
    number: 2,
    title: "Verify Your Skills",
    description: "Take AI-generated quizzes to prove your expertise and build trust",
  },
  {
    number: 3,
    title: "Get Matched",
    description: "Our algorithm finds compatible skill exchange partners based on your goals",
  },
  {
    number: 4,
    title: "Start Learning",
    description: "Connect via chat, video calls, and share resources with your matches",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-card/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Start your skill exchange journey in 4 simple steps
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="flex items-start gap-6 p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold">{step.number}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
