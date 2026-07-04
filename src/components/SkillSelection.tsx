import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Target, X, ArrowRight, Plus } from "lucide-react";

// Programming and Engineering skills only
const PROGRAMMING_SKILLS = [
  // Programming Languages
  { name: "JavaScript", category: "Programming Languages" },
  { name: "TypeScript", category: "Programming Languages" },
  { name: "Python", category: "Programming Languages" },
  { name: "Java", category: "Programming Languages" },
  { name: "C++", category: "Programming Languages" },
  { name: "C#", category: "Programming Languages" },
  { name: "Go", category: "Programming Languages" },
  { name: "Rust", category: "Programming Languages" },
  { name: "Ruby", category: "Programming Languages" },
  { name: "PHP", category: "Programming Languages" },
  { name: "Swift", category: "Programming Languages" },
  { name: "Kotlin", category: "Programming Languages" },
  { name: "Scala", category: "Programming Languages" },
  { name: "R", category: "Programming Languages" },
  
  // Web Development
  { name: "React", category: "Web Development" },
  { name: "Angular", category: "Web Development" },
  { name: "Vue.js", category: "Web Development" },
  { name: "Next.js", category: "Web Development" },
  { name: "Node.js", category: "Web Development" },
  { name: "Express.js", category: "Web Development" },
  { name: "Django", category: "Web Development" },
  { name: "Flask", category: "Web Development" },
  { name: "Spring Boot", category: "Web Development" },
  { name: "HTML/CSS", category: "Web Development" },
  { name: "Tailwind CSS", category: "Web Development" },
  { name: "GraphQL", category: "Web Development" },
  { name: "REST APIs", category: "Web Development" },
  
  // Mobile Development
  { name: "React Native", category: "Mobile Development" },
  { name: "Flutter", category: "Mobile Development" },
  { name: "iOS Development", category: "Mobile Development" },
  { name: "Android Development", category: "Mobile Development" },
  
  // Data Science & ML
  { name: "Machine Learning", category: "Data Science & ML" },
  { name: "Deep Learning", category: "Data Science & ML" },
  { name: "TensorFlow", category: "Data Science & ML" },
  { name: "PyTorch", category: "Data Science & ML" },
  { name: "Data Analysis", category: "Data Science & ML" },
  { name: "Natural Language Processing", category: "Data Science & ML" },
  { name: "Computer Vision", category: "Data Science & ML" },
  { name: "Data Visualization", category: "Data Science & ML" },
  
  // DevOps & Cloud
  { name: "AWS", category: "DevOps & Cloud" },
  { name: "Azure", category: "DevOps & Cloud" },
  { name: "Google Cloud", category: "DevOps & Cloud" },
  { name: "Docker", category: "DevOps & Cloud" },
  { name: "Kubernetes", category: "DevOps & Cloud" },
  { name: "CI/CD", category: "DevOps & Cloud" },
  { name: "Linux", category: "DevOps & Cloud" },
  { name: "Git", category: "DevOps & Cloud" },
  { name: "Terraform", category: "DevOps & Cloud" },
  
  // Databases
  { name: "SQL", category: "Databases" },
  { name: "PostgreSQL", category: "Databases" },
  { name: "MongoDB", category: "Databases" },
  { name: "Redis", category: "Databases" },
  { name: "Firebase", category: "Databases" },
  { name: "Supabase", category: "Databases" },
  
  // Engineering
  { name: "System Design", category: "Engineering" },
  { name: "Data Structures", category: "Engineering" },
  { name: "Algorithms", category: "Engineering" },
  { name: "Object-Oriented Programming", category: "Engineering" },
  { name: "Functional Programming", category: "Engineering" },
  { name: "Microservices", category: "Engineering" },
  { name: "Software Architecture", category: "Engineering" },
  { name: "Testing & QA", category: "Engineering" },
  { name: "Cybersecurity", category: "Engineering" },
  { name: "Embedded Systems", category: "Engineering" },
  { name: "IoT", category: "Engineering" },
  { name: "Blockchain", category: "Engineering" },
];

interface SkillSelectionProps {
  onComplete: () => void;
  userId: string;
}

const SkillSelection = ({ onComplete, userId }: SkillSelectionProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillsIHave, setSkillsIHave] = useState<string[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>([]);
  const [selectedHaveSkill, setSelectedHaveSkill] = useState<string>("");
  const [selectedLearnSkill, setSelectedLearnSkill] = useState<string>("");

  useEffect(() => {
    fetchUserSkills();
  }, [userId]);

  const fetchUserSkills = async () => {
    // Fetch user's existing skills
    const { data: userSkills } = await supabase
      .from("user_skills")
      .select("skill_id, skill_type, skills(name)")
      .eq("user_id", userId);

    if (userSkills) {
      const haveSkills = userSkills
        .filter(s => s.skill_type === "have")
        .map(s => (s.skills as any)?.name)
        .filter(Boolean);
      const learnSkills = userSkills
        .filter(s => s.skill_type === "learn")
        .map(s => (s.skills as any)?.name)
        .filter(Boolean);

      setSkillsIHave(haveSkills);
      setSkillsToLearn(learnSkills);
    }

    setLoading(false);
  };

  const addSkillToHave = () => {
    if (selectedHaveSkill && !skillsIHave.includes(selectedHaveSkill)) {
      // Remove from learn if present
      setSkillsToLearn(skillsToLearn.filter(s => s !== selectedHaveSkill));
      setSkillsIHave([...skillsIHave, selectedHaveSkill]);
      setSelectedHaveSkill("");
    }
  };

  const addSkillToLearn = () => {
    if (selectedLearnSkill && !skillsToLearn.includes(selectedLearnSkill)) {
      // Remove from have if present
      setSkillsIHave(skillsIHave.filter(s => s !== selectedLearnSkill));
      setSkillsToLearn([...skillsToLearn, selectedLearnSkill]);
      setSelectedLearnSkill("");
    }
  };

  const removeFromHave = (skill: string) => {
    setSkillsIHave(skillsIHave.filter(s => s !== skill));
  };

  const removeFromLearn = (skill: string) => {
    setSkillsToLearn(skillsToLearn.filter(s => s !== skill));
  };

  const handleSave = async () => {
    if (skillsIHave.length === 0 && skillsToLearn.length === 0) {
      toast({
        title: "Select some skills",
        description: "Please select at least one skill you have or want to learn.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    // First, get or create skills in the skills table
    const allSkillNames = [...new Set([...skillsIHave, ...skillsToLearn])];
    
    // Check which skills already exist
    const { data: existingSkills } = await supabase
      .from("skills")
      .select("id, name")
      .in("name", allSkillNames);

    const existingSkillMap = new Map(existingSkills?.map(s => [s.name, s.id]) || []);
    
    // Create missing skills
    const missingSkills = allSkillNames.filter(name => !existingSkillMap.has(name));
    if (missingSkills.length > 0) {
      const skillsToInsert = missingSkills.map(name => {
        const skillData = PROGRAMMING_SKILLS.find(s => s.name === name);
        return { name, category: skillData?.category || "Other" };
      });
      
      const { data: newSkills } = await supabase
        .from("skills")
        .insert(skillsToInsert)
        .select("id, name");
      
      newSkills?.forEach(s => existingSkillMap.set(s.name, s.id));
    }

    // Delete existing user skills
    await supabase.from("user_skills").delete().eq("user_id", userId);

    // Insert new skills
    const skillsToInsert = [
      ...skillsIHave.map(name => ({ 
        user_id: userId, 
        skill_id: existingSkillMap.get(name)!, 
        skill_type: "have" as const 
      })),
      ...skillsToLearn.map(name => ({ 
        user_id: userId, 
        skill_id: existingSkillMap.get(name)!, 
        skill_type: "learn" as const 
      })),
    ].filter(s => s.skill_id);

    if (skillsToInsert.length > 0) {
      const { error } = await supabase.from("user_skills").insert(skillsToInsert);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to save skills.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
    }

    toast({
      title: "Skills saved!",
      description: "Now verify your skills to connect with others.",
    });
    
    onComplete();
  };

  // Get available skills for dropdowns (excluding already selected)
  const availableHaveSkills = PROGRAMMING_SKILLS.filter(
    s => !skillsIHave.includes(s.name) && !skillsToLearn.includes(s.name)
  );
  const availableLearnSkills = PROGRAMMING_SKILLS.filter(
    s => !skillsToLearn.includes(s.name) && !skillsIHave.includes(s.name)
  );

  // Group skills by category for dropdown
  const groupedHaveSkills = availableHaveSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  const groupedLearnSkills = availableLearnSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Select Your Skills</h1>
        <p className="text-muted-foreground">
          Choose programming and engineering skills you have and want to learn
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Skills I Have */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Can Teach</h3>
              <p className="text-xs text-muted-foreground">Skills you have to share</p>
            </div>
          </div>
          
          {/* Dropdown to add skill */}
          <div className="flex gap-2 mb-4">
            <Select value={selectedHaveSkill} onValueChange={setSelectedHaveSkill}>
              <SelectTrigger className="bg-background flex-1">
                <SelectValue placeholder="Select a skill..." />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-[300px]">
                {Object.entries(groupedHaveSkills).map(([category, skills]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      {category}
                    </div>
                    {skills.map(skill => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="icon" 
              onClick={addSkillToHave}
              disabled={!selectedHaveSkill}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="min-h-[100px] flex flex-wrap gap-2 p-3 bg-background/50 rounded-lg border border-dashed border-border">
            {skillsIHave.length === 0 ? (
              <p className="text-sm text-muted-foreground w-full text-center py-6">
                Select skills from the dropdown above
              </p>
            ) : (
              skillsIHave.map(skill => (
                <span 
                  key={skill} 
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 text-sm"
                >
                  {skill}
                  <button 
                    onClick={() => removeFromHave(skill)}
                    className="ml-1 hover:bg-emerald-500/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Skills to Learn */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Want to Learn</h3>
              <p className="text-xs text-muted-foreground">Skills you want to acquire</p>
            </div>
          </div>
          
          {/* Dropdown to add skill */}
          <div className="flex gap-2 mb-4">
            <Select value={selectedLearnSkill} onValueChange={setSelectedLearnSkill}>
              <SelectTrigger className="bg-background flex-1">
                <SelectValue placeholder="Select a skill..." />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-[300px]">
                {Object.entries(groupedLearnSkills).map(([category, skills]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      {category}
                    </div>
                    {skills.map(skill => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="icon" 
              onClick={addSkillToLearn}
              disabled={!selectedLearnSkill}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="min-h-[100px] flex flex-wrap gap-2 p-3 bg-background/50 rounded-lg border border-dashed border-border">
            {skillsToLearn.length === 0 ? (
              <p className="text-sm text-muted-foreground w-full text-center py-6">
                Select skills from the dropdown above
              </p>
            ) : (
              skillsToLearn.map(skill => (
                <span 
                  key={skill} 
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm"
                >
                  {skill}
                  <button 
                    onClick={() => removeFromLearn(skill)}
                    className="ml-1 hover:bg-primary/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Continue"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SkillSelection;
