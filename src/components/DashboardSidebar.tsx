import { Award, Users, Send, Inbox, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface Verification {
  skill_id: string;
  passed: boolean;
  score: number;
  next_attempt_at: string | null;
}

interface QuickStats {
  incomingRequests: number;
  sentRequests: number;
  connections: number;
}

interface DashboardSidebarProps {
  skills: Skill[];
  verifications: Verification[];
  quickStats: QuickStats;
  onStartQuiz: (skill: Skill) => void;
  onOpenRequests: () => void;
}

const DashboardSidebar = ({ skills, verifications, quickStats, onStartQuiz, onOpenRequests }: DashboardSidebarProps) => {
  const getSkillStatus = (skillId: string) => {
    const verification = verifications.find(v => v.skill_id === skillId);
    if (!verification) return "not_attempted";
    if (verification.passed) return "passed";
    if (verification.next_attempt_at) {
      const nextAttempt = new Date(verification.next_attempt_at);
      if (nextAttempt > new Date()) return "cooldown";
    }
    return "failed";
  };

  const getCooldownDays = (skillId: string) => {
    const verification = verifications.find(v => v.skill_id === skillId);
    if (!verification?.next_attempt_at) return 0;
    const nextAttempt = new Date(verification.next_attempt_at);
    const now = new Date();
    const diff = Math.ceil((nextAttempt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const passedCount = verifications.filter(v => v.passed).length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="bg-card border border-border/60 dark:border-border rounded-xl p-4 shadow-card dark:shadow-none animate-slide-up-sm transition-all duration-300 hover:shadow-elevated dark:hover:shadow-lg dark:hover:shadow-primary/5 hover:border-secondary dark:hover:border-border">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Quick Stats</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onOpenRequests}
            className="flex flex-col items-center p-3 rounded-lg bg-secondary/50 dark:bg-background/50 hover:bg-secondary dark:hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-transparent hover:border-border/50"
          >
            <span className="text-2xl font-bold text-foreground">{quickStats.connections}</span>
            <span className="text-xs text-muted-foreground text-center flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Connections
            </span>
          </button>
          <button 
            onClick={onOpenRequests}
            className="flex flex-col items-center p-3 rounded-lg bg-secondary/50 dark:bg-background/50 hover:bg-secondary dark:hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-transparent hover:border-border/50"
          >
            <span className="text-2xl font-bold text-foreground">{quickStats.sentRequests}</span>
            <span className="text-xs text-muted-foreground text-center flex items-center gap-1">
              <Send className="w-3 h-3" /> Sent
            </span>
          </button>
          <button 
            onClick={onOpenRequests}
            className="flex flex-col items-center p-3 rounded-lg bg-secondary/50 dark:bg-background/50 hover:bg-secondary dark:hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-transparent hover:border-border/50"
          >
            <span className="text-2xl font-bold text-foreground">{quickStats.incomingRequests}</span>
            <span className="text-xs text-muted-foreground text-center flex items-center gap-1">
              <Inbox className="w-3 h-3" /> Incoming
            </span>
          </button>
          <div className="flex flex-col items-center p-3 rounded-lg bg-accent/15 dark:bg-primary/10 transition-all duration-200 hover:bg-accent/20 dark:hover:bg-primary/15 border border-accent/20 dark:border-transparent">
            <span className="text-2xl font-bold text-accent dark:text-primary">{passedCount}</span>
            <span className="text-xs text-muted-foreground text-center flex items-center gap-1">
              <Award className="w-3 h-3" /> Verified
            </span>
          </div>
        </div>
      </div>

      {/* Verify Skills */}
      <div className="bg-card border border-border/60 dark:border-border rounded-xl p-4 shadow-card dark:shadow-none animate-slide-up-sm stagger-2 transition-all duration-300 hover:shadow-elevated dark:hover:shadow-lg dark:hover:shadow-primary/5 hover:border-secondary dark:hover:border-border" style={{ animationFillMode: "both" }}>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Verify Skills</h3>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add skills you have to verify them
            </p>
          ) : (
            skills.map((skill, index) => {
              const status = getSkillStatus(skill.id);
              const cooldownDays = getCooldownDays(skill.id);

              return (
                <div 
                  key={skill.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 dark:bg-background/50 hover:bg-secondary/60 dark:hover:bg-muted/30 transition-all duration-200 border border-transparent hover:border-border/30"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{skill.name}</span>
                  </div>
                  {status === "passed" ? (
                    <Badge variant="secondary" className="bg-accent/20 text-accent dark:bg-emerald-500/20 dark:text-emerald-400 text-xs border border-accent/30 dark:border-transparent">
                      Verified
                    </Badge>
                  ) : status === "cooldown" ? (
                    <span className="text-xs text-muted-foreground">{cooldownDays}d left</span>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="default"
                      className="h-7 text-xs hover:scale-105 active:scale-95 transition-transform"
                      onClick={() => onStartQuiz(skill)}
                    >
                      Test
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
