import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardBackground from "@/components/ui/DashboardBackground";
import MyProfile from "@/components/MyProfile";
import SkillSelection from "@/components/SkillSelection";
import ProfileSetup from "@/components/ProfileSetup";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  education: string | null;
  qualification: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface Verification {
  skill_id: string;
  passed: boolean;
  score: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userSkillsHave, setUserSkillsHave] = useState<Skill[]>([]);
  const [userSkillsLearn, setUserSkillsLearn] = useState<Skill[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [view, setView] = useState<"profile" | "editProfile" | "manageSkills">("profile");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch user skills
        const { data: skillsData } = await supabase
          .from("user_skills")
          .select("skill_id, skill_type, skills(*)")
          .eq("user_id", userId);

        if (skillsData) {
          const haveSkills = skillsData
            .filter(s => s.skill_type === "have")
            .map(s => s.skills as unknown as Skill);
          const learnSkills = skillsData
            .filter(s => s.skill_type === "learn")
            .map(s => s.skills as unknown as Skill);
          setUserSkillsHave(haveSkills);
          setUserSkillsLearn(learnSkills);
        }

        // Fetch verifications
        const { data: verificationsData } = await supabase
          .from("skill_verifications")
          .select("skill_id, passed, score")
          .eq("user_id", userId);

        if (verificationsData) {
          setVerifications(verificationsData);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, toast]);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleEditProfile = () => {
    setView("editProfile");
  };

  const handleManageSkills = () => {
    setView("manageSkills");
  };

  const handleProfileComplete = async () => {
    // Refetch profile data
    if (userId) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    }
    setView("profile");
  };

  const handleSkillsComplete = async () => {
    // Refetch skills
    if (userId) {
      const { data: skillsData } = await supabase
        .from("user_skills")
        .select("skill_id, skill_type, skills(*)")
        .eq("user_id", userId);

      if (skillsData) {
        const haveSkills = skillsData
          .filter(s => s.skill_type === "have")
          .map(s => s.skills as unknown as Skill);
        const learnSkills = skillsData
          .filter(s => s.skill_type === "learn")
          .map(s => s.skills as unknown as Skill);
        setUserSkillsHave(haveSkills);
        setUserSkillsLearn(learnSkills);
      }
    }
    setView("profile");
  };

  if (loading) {
    return (
      <DashboardBackground variant="profile">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-primary">Loading profile...</div>
        </div>
      </DashboardBackground>
    );
  }

  if (!profile) {
    return (
      <DashboardBackground variant="profile">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Profile not found</div>
        </div>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground variant="profile">
      <div className="min-h-screen py-8 px-4">
        {view === "profile" && (
          <MyProfile
            profile={profile}
            userSkillsHave={userSkillsHave}
            userSkillsLearn={userSkillsLearn}
            verifications={verifications}
            onBack={handleBack}
            onEdit={handleEditProfile}
            onManageSkills={handleManageSkills}
          />
        )}

        {view === "editProfile" && userId && (
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setView("profile")} 
              className="mb-4 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Button>
            <ProfileSetup
              userId={userId}
              existingProfile={profile}
              onComplete={handleProfileComplete}
            />
          </div>
        )}

        {view === "manageSkills" && userId && (
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setView("profile")} 
              className="mb-4 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Button>
            <SkillSelection
              userId={userId}
              onComplete={handleSkillsComplete}
            />
          </div>
        )}
      </div>
    </DashboardBackground>
  );
};

export default Profile;
