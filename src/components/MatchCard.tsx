import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, X, GraduationCap, Target, Sparkles, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  profile: {
    id: string;
    full_name: string;
    age?: number;
    education?: string;
    bio?: string;
    avatar_url?: string;
  };
  canTeach: string[];
  wantsToLearn: string[];
  matchPercentage: number;
  isMutualMatch?: boolean;
  onConnect: () => void;
  onPass: () => void;
}

const MatchCard = ({ profile, canTeach, wantsToLearn, matchPercentage, isMutualMatch, onConnect, onPass }: MatchCardProps) => {
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getEducationLabel = (education?: string) => {
    const labels: Record<string, string> = {
      "high-school": "High School",
      "bachelors": "Bachelor's",
      "masters": "Master's",
      "phd": "PhD",
      "self-taught": "Self-taught",
    };
    return education ? labels[education] || education : "";
  };

  const getMatchColor = () => {
    if (matchPercentage >= 80) return "from-accent to-accent/80 dark:from-emerald-500 dark:to-emerald-600";
    if (matchPercentage >= 50) return "from-amber-500 to-orange-500";
    return "from-primary to-primary/80";
  };

  return (
    <div className="relative bg-gradient-to-br from-card via-card to-secondary/30 dark:to-primary/5 border border-border/60 dark:border-border/50 rounded-2xl p-6 shadow-card dark:shadow-xl dark:shadow-primary/5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated dark:hover:shadow-2xl dark:hover:shadow-primary/10 hover:border-accent/40 dark:hover:border-primary/30 animate-scale-in">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-secondary/40 dark:from-primary/10 to-transparent rounded-full blur-2xl pointer-events-none transition-opacity duration-300 group-hover:opacity-80" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-primary/20 shadow-lg shadow-primary/10">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                  {getInitials(profile.full_name || "?")}
                </AvatarFallback>
              </Avatar>
              {isMutualMatch && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg ring-2 ring-background">
                  <ArrowLeftRight className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{profile.full_name}</h3>
              <div className="flex gap-2 mt-1 flex-wrap">
                {profile.age && (
                  <Badge variant="outline" className="text-xs bg-background/50">{profile.age} years</Badge>
                )}
                {profile.education && (
                  <Badge variant="outline" className="text-xs bg-background/50">{getEducationLabel(profile.education)}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn("bg-gradient-to-r text-white shadow-lg", getMatchColor())}>
              <Sparkles className="w-3 h-3 mr-1" />
              {matchPercentage}% match
            </Badge>
            {isMutualMatch && (
              <span className="text-[10px] text-emerald-500 font-medium">Mutual Exchange</span>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 bg-background/30 rounded-lg p-3 border border-border/30">{profile.bio}</p>
        )}

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="bg-gradient-to-br from-accent/15 to-accent/5 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-xl p-4 border border-accent/25 dark:border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent/20 dark:bg-emerald-500/20 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-accent dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Can Teach</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {canTeach.length > 0 ? (
                canTeach.slice(0, 4).map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs bg-accent/15 text-accent dark:bg-emerald-500/10 dark:text-emerald-300 border border-accent/25 dark:border-emerald-500/20">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No skills added</span>
              )}
              {canTeach.length > 4 && (
                <Badge variant="outline" className="text-xs border-accent/40 text-accent dark:border-emerald-500/30 dark:text-emerald-400">+{canTeach.length - 4}</Badge>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Wants to Learn</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {wantsToLearn.length > 0 ? (
                wantsToLearn.slice(0, 4).map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs bg-primary/10 text-primary border border-primary/20">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No skills added</span>
              )}
              {wantsToLearn.length > 4 && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">+{wantsToLearn.length - 4}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
            onClick={onPass}
          >
            <X className="w-4 h-4 mr-2" />
            Pass
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]" 
            onClick={onConnect}
          >
            <Heart className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
