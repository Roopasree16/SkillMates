// Dashboard component - main user interface after login
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Moon, Sun, MessageCircle, FolderOpen, ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProfileSetup from "@/components/ProfileSetup";
import SkillSelection from "@/components/SkillSelection";
import DashboardSidebar from "@/components/DashboardSidebar";
import MatchCard from "@/components/MatchCard";
import SkillVerification from "@/components/SkillVerification";
import ProfileDropdown from "@/components/ProfileDropdown";
import MyProfile from "@/components/MyProfile";
import SharedResources from "@/components/SharedResources";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import RequestsPanel from "@/components/RequestsPanel";
import ChatPanel from "@/components/chat/ChatPanel";
import { useTheme } from "next-themes";
import { usePresence } from "@/hooks/usePresence";
import DashboardBackground from "@/components/ui/DashboardBackground";
import PageTransition from "@/components/ui/PageTransition";
import Confetti from "@/components/ui/Confetti";
import MatchCardSkeleton from "@/components/skeletons/MatchCardSkeleton";

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
  profile_completed: boolean | null;
}

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface UserSkill {
  skill_id: string;
  skill_type: string;
  skills: Skill;
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [setupStep, setSetupStep] = useState<"profile" | "skills" | "complete">("profile");
  const [userSkillsHave, setUserSkillsHave] = useState<Skill[]>([]);
  const [userSkillsLearn, setUserSkillsLearn] = useState<Skill[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [activeQuizSkill, setActiveQuizSkill] = useState<Skill | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showManageSkills, setShowManageSkills] = useState(false);
  const [showSharedResources, setShowSharedResources] = useState(false);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [initialChatUserId, setInitialChatUserId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    incomingRequests: 0,
    sentRequests: 0,
    connections: 0,
  });

  // Track user presence (updates last_seen)
  usePresence(userId);

  const fetchUserData = useCallback(async (uid: string) => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", uid)
      .single();

    setProfile(profileData);

    if (profileData?.profile_completed) {
      // Fetch user skills
      const { data: skillsData } = await supabase
        .from("user_skills")
        .select("skill_id, skill_type, skills(*)")
        .eq("user_id", uid);

      const haveSkills = skillsData?.filter(s => s.skill_type === "have").map(s => s.skills as unknown as Skill) || [];
      const learnSkills = skillsData?.filter(s => s.skill_type === "learn").map(s => s.skills as unknown as Skill) || [];

      setUserSkillsHave(haveSkills);
      setUserSkillsLearn(learnSkills);

      if (haveSkills.length > 0 || learnSkills.length > 0) {
        setSetupStep("complete");
        
        // Fetch verifications
        const { data: verificationsData } = await supabase
          .from("skill_verifications")
          .select("skill_id, passed, score, next_attempt_at")
          .eq("user_id", uid);
        
        setVerifications(verificationsData || []);

        // Fetch potential matches (other users with complementary skills)
        await fetchPotentialMatches(uid, haveSkills, learnSkills);
        
        // Fetch quick stats
        await fetchQuickStats(uid);
      } else {
        setSetupStep("skills");
      }
    } else {
      setSetupStep("profile");
    }

    setLoading(false);
  }, []);

  const fetchQuickStats = async (uid: string) => {
    // Incoming requests (pending, where I'm recipient)
    const { count: incomingCount } = await supabase
      .from("connection_requests")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", uid)
      .eq("status", "pending");

    // Sent requests (only pending)
    const { count: sentCount } = await supabase
      .from("connection_requests")
      .select("*", { count: "exact", head: true })
      .eq("from_user_id", uid)
      .eq("status", "pending");

    // Passed profiles
    const { count: passedCount } = await supabase
      .from("passed_profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid);

    // Connections (accepted requests)
    const { count: connectionCount } = await supabase
      .from("connection_requests")
      .select("*", { count: "exact", head: true })
      .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
      .eq("status", "accepted");

    setQuickStats({
      incomingRequests: incomingCount || 0,
      sentRequests: sentCount || 0,
      connections: connectionCount || 0,
    });
  };

  const fetchUnreadMessages = async (uid: string) => {
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant_1.eq.${uid},participant_2.eq.${uid}`);

    if (!conversations || conversations.length === 0) {
      setUnreadMessages(0);
      return;
    }

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", conversations.map(c => c.id))
      .eq("is_read", false)
      .neq("sender_id", uid);

    setUnreadMessages(count || 0);
  };

  const fetchPotentialMatches = async (uid: string, haveSkills: Skill[], learnSkills: Skill[]) => {
    // Get existing connection requests to filter out
    const { data: existingRequests } = await supabase
      .from("connection_requests")
      .select("from_user_id, to_user_id")
      .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`);

    const connectedUserIds = new Set<string>();
    existingRequests?.forEach(req => {
      if (req.from_user_id === uid) connectedUserIds.add(req.to_user_id);
      if (req.to_user_id === uid) connectedUserIds.add(req.from_user_id);
    });

    // Get passed profiles to filter out
    const { data: passedData } = await supabase
      .from("passed_profiles")
      .select("passed_user_id")
      .eq("user_id", uid);

    const passedUserIds = new Set((passedData || []).map(p => p.passed_user_id));
    // Get all other users who have verified skills
    const { data: otherUsers } = await supabase
      .from("profiles")
      .select("*")
      .neq("user_id", uid)
      .eq("profile_completed", true);

    if (!otherUsers || otherUsers.length === 0) {
      setPotentialMatches([]);
      return;
    }

    // For each user, get their skills and calculate match
    const matchesWithData = await Promise.all(
      otherUsers
        .filter(user => !connectedUserIds.has(user.user_id) && !passedUserIds.has(user.user_id))
        .map(async (user) => {
          const { data: theirSkills } = await supabase
            .from("user_skills")
            .select("skill_id, skill_type, skills(*)")
            .eq("user_id", user.user_id);

          const theirHaveSkills = theirSkills?.filter(s => s.skill_type === "have").map(s => s.skills as unknown as Skill) || [];
          const theirLearnSkills = theirSkills?.filter(s => s.skill_type === "learn").map(s => s.skills as unknown as Skill) || [];

          // If they have verified skills, prefer those; otherwise allow unverified skills too
          const { data: theirVerifications } = await supabase
            .from("skill_verifications")
            .select("skill_id")
            .eq("user_id", user.user_id)
            .eq("passed", true);

          const verifiedSkillIds = new Set((theirVerifications || []).map(v => v.skill_id));
          const verifiedHaveSkills = theirHaveSkills.filter(s => verifiedSkillIds.has(s.id));
          const teachSkills = verifiedHaveSkills.length > 0 ? verifiedHaveSkills : theirHaveSkills;

          // Match criteria: They can teach what I want to learn
          const theyCanTeachMe = teachSkills.filter(s => learnSkills.some(ls => ls.id === s.id));
          
          // Bonus: I can also teach what they want to learn (bidirectional)
          const iCanTeachThem = haveSkills.filter(s => theirLearnSkills.some(tl => tl.id === s.id));

          // At least one match where they can teach me something I want to learn
          const isMatch = theyCanTeachMe.length > 0;
          const isMutualMatch = theyCanTeachMe.length > 0 && iCanTeachThem.length > 0;

          // Calculate match score - prioritize mutual matches but include one-way matches
          const matchScore = theyCanTeachMe.length * 2 + iCanTeachThem.length;
          const maxPossible = Math.max(1, learnSkills.length * 2 + haveSkills.length);
          const matchPercentage = Math.min(100, Math.round((matchScore / maxPossible) * 100));

          return {
            profile: user,
            canTeach: theirHaveSkills.map(s => s.name),
            wantsToLearn: theirLearnSkills.map(s => s.name),
            matchPercentage,
            isMatch,
            isMutualMatch,
          };
        })
    );

    // Filter users who can teach me something and sort by match percentage (mutual first)
    const validMatches = matchesWithData
      .filter(m => m.isMatch)
      .sort((a, b) => {
        // Prioritize mutual matches
        if (a.isMutualMatch && !b.isMutualMatch) return -1;
        if (!a.isMutualMatch && b.isMutualMatch) return 1;
        return b.matchPercentage - a.matchPercentage;
      });

    setPotentialMatches(validMatches);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email || null);
      await fetchUserData(session.user.id);
      await fetchUnreadMessages(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, fetchUserData]);

  // Subscribe to message updates for unread count and quick stats
  useEffect(() => {
    if (!userId) return;

    const messagesChannel = supabase
      .channel("unread-messages-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchUnreadMessages(userId);
        }
      )
      .subscribe();

    const requestsChannel = supabase
      .channel("connection-requests-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connection_requests" },
        () => {
          fetchQuickStats(userId);
        }
      )
      .subscribe();

    const passedChannel = supabase
      .channel("passed-profiles-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "passed_profiles" },
        () => {
          fetchQuickStats(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(passedChannel);
    };
  }, [userId]);

  const handleViewProfile = () => {
    setShowProfile(true);
    setShowEditProfile(false);
    setShowManageSkills(false);
    setShowSharedResources(false);
    setShowRequestsPanel(false);
    setShowChatPanel(false);
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
    setShowProfile(false);
    setShowManageSkills(false);
  };

  const handleManageSkills = () => {
    setShowManageSkills(true);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowSharedResources(false);
  };

  const handleProfileComplete = async () => {
    setShowEditProfile(false);
    // Fetch updated profile data to ensure state is in sync
    if (userId) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      setProfile(profileData);
      
      // Check if user already has skills
      const { data: skillsData } = await supabase
        .from("user_skills")
        .select("skill_id, skill_type, skills(*)")
        .eq("user_id", userId);
      
      const haveSkills = skillsData?.filter(s => s.skill_type === "have").map(s => s.skills as unknown as Skill) || [];
      const learnSkills = skillsData?.filter(s => s.skill_type === "learn").map(s => s.skills as unknown as Skill) || [];
      
      if (haveSkills.length > 0 || learnSkills.length > 0) {
        // User already has skills, go to complete
        setUserSkillsHave(haveSkills);
        setUserSkillsLearn(learnSkills);
        setSetupStep("complete");
      } else {
        // User needs to select skills
        setSetupStep("skills");
      }
    } else {
      setSetupStep("skills");
    }
  };

  const handleSkillsComplete = async () => {
    setShowManageSkills(false);
    if (userId) {
      await fetchUserData(userId);
    }
  };

  const handleStartQuiz = (skill: Skill) => {
    setActiveQuizSkill(skill);
    setQuizStarted(true);
  };

  const handleQuizComplete = async () => {
    setActiveQuizSkill(null);
    setQuizStarted(false);
    if (userId) {
      // Refresh verifications
      const { data: verificationsData } = await supabase
        .from("skill_verifications")
        .select("skill_id, passed, score, next_attempt_at")
        .eq("user_id", userId);
      
      setVerifications(verificationsData || []);
      await fetchPotentialMatches(userId, userSkillsHave, userSkillsLearn);
    }
  };

  const handleConnect = async (matchUserId: string) => {
    if (!userId) return;

    try {
      // Create connection request
      const { data: requestData, error: requestError } = await supabase
        .from("connection_requests")
        .insert({
          from_user_id: userId,
          to_user_id: matchUserId,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Get my profile name
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();

      // Create notification for the other user
      await supabase.from("notifications").insert({
        user_id: matchUserId,
        type: "connection_request",
        title: "New Connection Request",
        message: `${myProfile?.full_name || "Someone"} wants to connect with you!`,
        related_user_id: userId,
        related_request_id: requestData.id,
      });

      toast({
        title: "Request sent!",
        description: "Your connection request has been sent.",
      });

      // Trigger confetti celebration
      setShowConfetti(true);

      // Remove the match from the list immediately and refresh stats
      setPotentialMatches(prev => prev.filter(m => m.profile.user_id !== matchUserId));
      setCurrentMatchIndex(prev => Math.max(0, Math.min(prev, potentialMatches.length - 2)));
      await fetchQuickStats(userId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request.",
        variant: "destructive",
      });
    }
  };

  const handlePass = async (matchUserId: string) => {
    if (!userId) return;
    
    // Store in passed_profiles
    await supabase.from("passed_profiles").insert({
      user_id: userId,
      passed_user_id: matchUserId,
    });
    
    // Remove the passed match from the list immediately
    setPotentialMatches(prev => prev.filter(m => m.profile.user_id !== matchUserId));
    setCurrentMatchIndex(prev => Math.max(0, Math.min(prev, potentialMatches.length - 2)));
    await fetchQuickStats(userId);
  };

  const refreshData = async () => {
    if (userId) {
      await fetchUserData(userId);
    }
  };

  const handleBackToDashboard = () => {
    setShowProfile(false);
    setShowEditProfile(false);
    setShowManageSkills(false);
    setShowSharedResources(false);
    setShowRequestsPanel(false);
    setShowChatPanel(false);
    setInitialChatUserId(null);
  };

  const handleOpenSharedResources = () => {
    setShowSharedResources(true);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowManageSkills(false);
    setShowRequestsPanel(false);
    setShowChatPanel(false);
  };

  const handleOpenRequests = () => {
    setShowRequestsPanel(true);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowManageSkills(false);
    setShowSharedResources(false);
    setShowChatPanel(false);
  };

  const handleOpenChat = (otherUserId?: string) => {
    setInitialChatUserId(otherUserId || null);
    setShowChatPanel(true);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowManageSkills(false);
    setShowSharedResources(false);
    setShowRequestsPanel(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (loading) {
    return (
      <DashboardBackground variant="default">
        <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
        <div className="min-h-screen">
          {/* Skeleton navbar */}
          <nav className="border-b border-border bg-card">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary/20 animate-pulse" />
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-6 py-8">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              {/* Skeleton sidebar */}
              <div className="order-2 lg:order-1 space-y-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
              {/* Skeleton match card */}
              <div className="order-1 lg:order-2">
                <MatchCardSkeleton />
              </div>
            </div>
          </main>
        </div>
      </DashboardBackground>
    );
  }

  // Show quiz if active - no back button when quiz started (compulsory completion)
  if (activeQuizSkill) {
    return (
      <DashboardBackground variant="default">
        <div className="min-h-screen">
          <div className="container mx-auto px-6 py-8">
            {!quizStarted && (
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => setActiveQuizSkill(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <SkillVerification 
              preSelectedSkill={activeQuizSkill}
              onComplete={handleQuizComplete}
              userSkills={userSkillsHave}
            />
          </div>
        </div>
      </DashboardBackground>
    );
  }

  // Navbar (same for all views)
  const navbar = (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">SkillMates</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex relative" onClick={() => handleOpenChat()}>
            <MessageCircle className="w-4 h-4" />
            {unreadMessages > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={handleOpenRequests}>
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={handleOpenSharedResources}>
            <FolderOpen className="w-4 h-4" />
          </Button>
          {userId && <NotificationsDropdown userId={userId} onUpdate={refreshData} onAcceptConnection={handleOpenChat} />}
          <ProfileDropdown />
        </div>
      </div>
    </nav>
  );

  // Show My Profile view - CHECK THIS FIRST before other panels
  if (showProfile && profile) {
    return (
      <DashboardBackground variant="profile">
        <div className="min-h-screen">
          {navbar}
          <PageTransition key="profile" variant="slide-up">
            <main className="container mx-auto px-6 py-8">
              <MyProfile 
                profile={profile}
                userSkillsHave={userSkillsHave}
                userSkillsLearn={userSkillsLearn}
                verifications={verifications}
                onBack={handleBackToDashboard}
                onEdit={handleEditProfile}
                onManageSkills={handleManageSkills}
              />
            </main>
          </PageTransition>
        </div>
      </DashboardBackground>
    );
  }

  // Show Chat Panel
  if (showChatPanel && userId) {
    return (
      <DashboardBackground variant="chat">
        <div className="min-h-screen">
          {navbar}
          <PageTransition key="chat" variant="slide-right">
            <main className="container mx-auto px-6 py-8">
              <ChatPanel userId={userId} onBack={handleBackToDashboard} onMessagesRead={() => fetchUnreadMessages(userId)} initialChatUserId={initialChatUserId} />
            </main>
          </PageTransition>
        </div>
      </DashboardBackground>
    );
  }

  // Show Requests Panel
  if (showRequestsPanel && userId) {
    return (
      <DashboardBackground variant="network">
        <div className="min-h-screen">
          {navbar}
          <PageTransition key="requests" variant="slide-up">
            <main className="container mx-auto px-6 py-8">
              <RequestsPanel 
                userId={userId} 
                onBack={handleBackToDashboard} 
                onUpdate={() => {
                  refreshData();
                  fetchQuickStats(userId);
                }}
                onStartChat={(otherUserId) => {
                  handleOpenChat(otherUserId);
                }}
              />
            </main>
          </PageTransition>
        </div>
      </DashboardBackground>
    );
  }

  // Show Shared Resources view
  if (showSharedResources && userId) {
    return (
      <DashboardBackground variant="resources">
        <div className="min-h-screen">
          {navbar}
          <PageTransition key="resources" variant="scale">
            <main className="container mx-auto px-6 py-8">
              <SharedResources userId={userId} onBack={handleBackToDashboard} />
            </main>
          </PageTransition>
        </div>
      </DashboardBackground>
    );
  }

  // Show profile edit view
  if (showEditProfile) {
    return (
      <DashboardBackground variant="profile">
        <div className="min-h-screen">
          {navbar}
          <PageTransition key="edit-profile" variant="slide-up">
            <main className="container mx-auto px-6 py-8">
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={handleBackToDashboard}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <ProfileSetup 
                onComplete={() => {
                  setShowEditProfile(false);
                  if (userId) fetchUserData(userId);
                }} 
                userId={userId!}
                existingProfile={profile || undefined}
              />
            </main>
          </PageTransition>
        </div>
      </DashboardBackground>
    );
  }

  // Show manage skills view
  if (showManageSkills) {
    return (
      <DashboardBackground variant="default">
        <div className="min-h-screen">
          {navbar}
          <PageTransition key="manage-skills" variant="slide-up">
            <main className="container mx-auto px-6 py-8">
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={handleBackToDashboard}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <SkillSelection 
                onComplete={handleSkillsComplete} 
                userId={userId!}
              />
            </main>
          </PageTransition>
        </div>
      </DashboardBackground>
    );
  }

  // Profile setup flow
  if (setupStep === "profile") {
    return (
      <DashboardBackground variant="profile">
        <div className="min-h-screen">
          {navbar}
          <main className="container mx-auto px-6 py-8">
            <ProfileSetup 
              onComplete={handleProfileComplete} 
              userId={userId!}
              existingProfile={profile || undefined}
            />
          </main>
        </div>
      </DashboardBackground>
    );
  }

  // Skills selection flow
  if (setupStep === "skills") {
    return (
      <DashboardBackground variant="default">
        <div className="min-h-screen">
          {navbar}
          <main className="container mx-auto px-6 py-8">
            <SkillSelection 
              onComplete={handleSkillsComplete} 
              userId={userId!}
            />
          </main>
        </div>
      </DashboardBackground>
    );
  }

  // Main dashboard
  const currentMatch = potentialMatches[currentMatchIndex];
  const hasAnySkills = userSkillsHave.length + userSkillsLearn.length > 0;
  const isEligibleToMatch = hasAnySkills;

  return (
    <DashboardBackground variant="network">
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="min-h-screen">
        {navbar}
        <PageTransition key="dashboard-main" variant="fade">
          <main className="container mx-auto px-6 py-8">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              {/* Sidebar */}
              <div className="order-2 lg:order-1">
                <DashboardSidebar 
                  skills={userSkillsHave}
                  verifications={verifications}
                  quickStats={quickStats}
                  onStartQuiz={handleStartQuiz}
                  onOpenRequests={handleOpenRequests}
                />
              </div>

              {/* Main Content - Matches */}
              <div className="order-1 lg:order-2">
                {!isEligibleToMatch ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Verify Your Skills
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Score 80% or higher on a skill test to start connecting with others.
                      Use the sidebar to take a test on any skill you have.
                    </p>
                  </div>
                ) : potentialMatches.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      No Matches Yet
                    </h2>
                    <p className="text-muted-foreground">
                      No verified users with matching skills found. Check back later!
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      {currentMatchIndex + 1} of {potentialMatches.length} potential matches
                    </p>
                    <MatchCard
                      profile={currentMatch.profile}
                      canTeach={currentMatch.canTeach}
                      wantsToLearn={currentMatch.wantsToLearn}
                      matchPercentage={currentMatch.matchPercentage}
                      isMutualMatch={currentMatch.isMutualMatch}
                      onConnect={() => handleConnect(currentMatch.profile.user_id)}
                      onPass={() => handlePass(currentMatch.profile.user_id)}
                    />
                  </div>
                )}
              </div>
            </div>
          </main>
        </PageTransition>
      </div>
    </DashboardBackground>
  );
};

export default Dashboard;
