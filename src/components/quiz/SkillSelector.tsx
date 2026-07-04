import { Award, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Skill {
  id: string;
  name: string;
  category: string | null;
}

interface SkillSelectorProps {
  skills: Skill[];
  getSkillStatus: (skillId: string) => string;
  getCooldownRemaining: (skillId: string) => number | null;
  onSelectSkill: (skill: Skill) => void;
}

const SkillSelector = ({
  skills,
  getSkillStatus,
  getCooldownRemaining,
  onSelectSkill,
}: SkillSelectorProps) => {
  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Skills</h1>
        <p className="text-muted-foreground">
          Take a 10-question AI-generated quiz to verify your expertise. Score 70% or higher to pass.
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold text-foreground mb-4">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categorySkills.map((skill) => {
                const status = getSkillStatus(skill.id);
                const cooldownDays = getCooldownRemaining(skill.id);

                return (
                  <div
                    key={skill.id}
                    className={`relative p-4 rounded-xl border transition-all ${
                      status === "passed"
                        ? "bg-green-500/10 border-green-500/30"
                        : status === "cooldown"
                        ? "bg-secondary/50 border-border opacity-60"
                        : "bg-card border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{skill.name}</span>
                      {status === "passed" && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {status === "cooldown" && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">{cooldownDays}d</span>
                        </div>
                      )}
                    </div>

                    {status !== "passed" && (
                      <Button
                        variant={status === "cooldown" ? "ghost" : "outline"}
                        size="sm"
                        className="w-full mt-3"
                        disabled={status === "cooldown"}
                        onClick={() => onSelectSkill(skill)}
                      >
                        {status === "cooldown" ? "Cooldown Active" : "Take Quiz"}
                      </Button>
                    )}

                    {status === "passed" && (
                      <div className="mt-3 text-center text-sm text-green-500 font-medium">
                        Verified ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillSelector;
