import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { X, Check, UserX, Clock, Send, Inbox, ArrowLeft, GraduationCap, Target, MessageCircle, CheckCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReviewDialog from "./ReviewDialog";
import Confetti from "./ui/Confetti";
import RequestCardSkeleton from "./skeletons/RequestCardSkeleton";
interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface ConnectionRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  profile?: Profile;
  skills?: { canTeach: string[]; wantsToLearn: string[] };
}

interface PassedProfile {
  id: string;
  passed_user_id: string;
  profile?: Profile;
}

interface RequestsPanelProps {
  userId: string;
  onBack: () => void;
  onUpdate: () => void;
  onStartChat?: (otherUserId: string) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const RequestsPanel = ({ userId, onBack, onUpdate, onStartChat }: RequestsPanelProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("accepted");
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [sent, setSent] = useState<ConnectionRequest[]>([]);
  const [accepted, setAccepted] = useState<ConnectionRequest[]>([]);
  const [passed, setPassed] = useState<PassedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedUserForReview, setSelectedUserForReview] = useState<{
    userId: string;
    name: string;
    existingReview?: { id: string; rating: number; comment: string | null };
  } | null>(null);

  const handleOpenReviewDialog = async (userIdToReview: string, userName: string) => {
    // Check if there's an existing review
    const { data: existing } = await supabase
      .from("reviews")
      .select("id, rating, comment")
      .eq("reviewer_id", userId)
      .eq("reviewed_user_id", userIdToReview)
      .maybeSingle();

    setSelectedUserForReview({
      userId: userIdToReview,
      name: userName,
      existingReview: existing || undefined,
    });
    setReviewDialogOpen(true);
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch incoming requests (where I'm the recipient)
    const { data: incomingData } = await supabase
      .from("connection_requests")
      .select("*")
      .eq("to_user_id", userId)
      .eq("status", "pending");

    // Fetch sent requests (where I'm the sender) - only pending ones
    const { data: sentData } = await supabase
      .from("connection_requests")
      .select("*")
      .eq("from_user_id", userId)
      .eq("status", "pending");

    // Fetch accepted connections (where I'm either sender or recipient)
    const { data: acceptedFromMe } = await supabase
      .from("connection_requests")
      .select("*")
      .eq("from_user_id", userId)
      .eq("status", "accepted");

    const { data: acceptedToMe } = await supabase
      .from("connection_requests")
      .select("*")
      .eq("to_user_id", userId)
      .eq("status", "accepted");

    // Fetch passed profiles
    const { data: passedData } = await supabase
      .from("passed_profiles")
      .select("*")
      .eq("user_id", userId);

    // Enrich with profile data
    const enrichWithProfiles = async (requests: any[], userIdField: string) => {
      const userIds = requests.map((r) => r[userIdField]);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Get skills for each user
      const { data: allSkills } = await supabase
        .from("user_skills")
        .select("user_id, skill_type, skills(name)")
        .in("user_id", userIds);

      const skillsMap = new Map<string, { canTeach: string[]; wantsToLearn: string[] }>();
      allSkills?.forEach((s) => {
        if (!skillsMap.has(s.user_id)) {
          skillsMap.set(s.user_id, { canTeach: [], wantsToLearn: [] });
        }
        const entry = skillsMap.get(s.user_id)!;
        const skillName = (s.skills as any)?.name;
        if (skillName) {
          if (s.skill_type === "have") entry.canTeach.push(skillName);
          else entry.wantsToLearn.push(skillName);
        }
      });

      return requests.map((r) => ({
        ...r,
        profile: profileMap.get(r[userIdField]),
        skills: skillsMap.get(r[userIdField]) || { canTeach: [], wantsToLearn: [] },
      }));
    };

    const enrichedIncoming = await enrichWithProfiles(incomingData || [], "from_user_id");
    const enrichedSent = await enrichWithProfiles(sentData || [], "to_user_id");
    
    // For accepted, we need to get the OTHER user's profile
    const acceptedFromMeEnriched = await enrichWithProfiles(acceptedFromMe || [], "to_user_id");
    const acceptedToMeEnriched = await enrichWithProfiles(acceptedToMe || [], "from_user_id");
    const enrichedAccepted = [...acceptedFromMeEnriched, ...acceptedToMeEnriched];

    // Enrich passed profiles
    const passedUserIds = passedData?.map((p) => p.passed_user_id) || [];
    let enrichedPassed: PassedProfile[] = [];
    if (passedUserIds.length > 0) {
      const { data: passedProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", passedUserIds);

      const passedProfileMap = new Map(passedProfiles?.map((p) => [p.user_id, p]) || []);
      enrichedPassed = (passedData || []).map((p) => ({
        ...p,
        profile: passedProfileMap.get(p.passed_user_id),
      }));
    }

    setIncoming(enrichedIncoming);
    setSent(enrichedSent);
    setAccepted(enrichedAccepted);
    setPassed(enrichedPassed);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleAccept = async (request: ConnectionRequest) => {
    try {
      const { error } = await supabase
        .from("connection_requests")
        .update({ status: "accepted" })
        .eq("id", request.id);

      if (error) {
        toast({ title: "Error", description: "Failed to accept request", variant: "destructive" });
        return;
      }

      // Create a conversation between the two users
      const { error: convError } = await supabase.from("conversations").insert({
        participant_1: request.from_user_id,
        participant_2: userId,
      });

      if (convError) {
        console.error("Failed to create conversation:", convError);
        // Try with swapped participants in case of unique constraint
        const { error: convError2 } = await supabase.from("conversations").insert({
          participant_1: userId,
          participant_2: request.from_user_id,
        });
        if (convError2) {
          console.error("Second attempt also failed:", convError2);
        }
      }

      // Notify the sender
      await supabase.from("notifications").insert({
        user_id: request.from_user_id,
        type: "request_accepted",
        title: "Connection Accepted!",
        message: `Your connection request was accepted! You can now chat.`,
        related_user_id: userId,
      });

      // Trigger confetti celebration
      setShowConfetti(true);

      toast({ title: "Accepted!", description: "You are now connected. Start chatting!" });
      fetchData();
      onUpdate();
    } catch (err) {
      console.error("Error accepting request:", err);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  const handleReject = async (request: ConnectionRequest) => {
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "rejected" })
      .eq("id", request.id);

    if (error) {
      toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
      return;
    }

    // Notify the sender
    await supabase.from("notifications").insert({
      user_id: request.from_user_id,
      type: "request_rejected",
      title: "Connection Declined",
      message: `Your connection request was declined.`,
      related_user_id: userId,
    });

    toast({ title: "Rejected", description: "Request declined." });
    fetchData();
    onUpdate();
  };

  const handleCancelSent = async (request: ConnectionRequest) => {
    await supabase.from("connection_requests").delete().eq("id", request.id);
    toast({ title: "Cancelled", description: "Request cancelled." });
    fetchData();
    onUpdate();
  };

  const handleUnpass = async (passedProfile: PassedProfile) => {
    await supabase.from("passed_profiles").delete().eq("id", passedProfile.id);
    toast({ title: "Removed", description: "Removed from passed list." });
    fetchData();
    onUpdate();
  };

  const renderProfileCard = (
    profile: Profile | undefined,
    skills: { canTeach: string[]; wantsToLearn: string[] } | undefined,
    actions: React.ReactNode
  ) => {
    if (!profile) return null;
    return (
      <div className="bg-card border border-border/60 dark:border-border rounded-lg p-4 flex items-start gap-4 shadow-card dark:shadow-none transition-all duration-300 hover:shadow-elevated dark:hover:shadow-lg hover:border-secondary dark:hover:border-border">
        <Avatar className="w-12 h-12 bg-primary/20 border-2 border-primary/20">
          <AvatarFallback className="text-primary font-semibold bg-gradient-to-br from-primary/20 to-primary/5">
            {getInitials(profile.full_name || "?")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{profile.full_name}</h4>
          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-1">{profile.bio}</p>
          )}
          {skills && (
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.canTeach.slice(0, 2).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs gap-1 bg-accent/15 text-accent dark:bg-secondary dark:text-secondary-foreground border border-accent/25 dark:border-transparent">
                  <GraduationCap className="w-3 h-3" />
                  {s}
                </Badge>
              ))}
              {skills.wantsToLearn.slice(0, 2).map((s) => (
                <Badge key={s} variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                  <Target className="w-3 h-3" />
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">{actions}</div>
      </div>
    );
  };

  return (
    <>
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold text-foreground">Requests</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="accepted" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Connected</span> {accepted.length > 0 && `(${accepted.length})`}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="gap-2">
            <Inbox className="w-4 h-4" />
            <span className="hidden sm:inline">Incoming</span> {incoming.length > 0 && `(${incoming.length})`}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Sent</span> {sent.length > 0 && `(${sent.length})`}
          </TabsTrigger>
          <TabsTrigger value="passed" className="gap-2">
            <UserX className="w-4 h-4" />
            <span className="hidden sm:inline">Passed</span> {passed.length > 0 && `(${passed.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accepted" className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-foreground">Your Connections</span>
          </div>
          {loading ? (
            <RequestCardSkeleton count={3} />
          ) : accepted.length === 0 ? (
            <div className="bg-card border border-border/60 dark:border-border rounded-lg p-8 text-center text-muted-foreground shadow-card dark:shadow-none">
              No connections yet
            </div>
          ) : (
            accepted.map((req) => {
              const otherUserId = req.profile?.user_id;
              const otherUserName = req.profile?.full_name || "User";
              return renderProfileCard(req.profile, req.skills, (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => otherUserId && handleOpenReviewDialog(otherUserId, otherUserName)} 
                    className="gap-1"
                  >
                    <Star className="w-4 h-4" />
                    Review
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => otherUserId && onStartChat?.(otherUserId)} 
                    className="gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Button>
                </div>
              ));
            })
          )}
        </TabsContent>

        <TabsContent value="incoming" className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">Incoming Requests</span>
          </div>
          {loading ? (
            <RequestCardSkeleton count={2} />
          ) : incoming.length === 0 ? (
            <div className="bg-card border border-border/60 dark:border-border rounded-lg p-8 text-center text-muted-foreground shadow-card dark:shadow-none">
              No incoming requests
            </div>
          ) : (
            incoming.map((req) =>
              renderProfileCard(req.profile, req.skills, (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleReject(req)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => handleAccept(req)}>
                    <Check className="w-4 h-4" />
                  </Button>
                </>
              ))
            )
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">Sent Requests</span>
          </div>
          {loading ? (
            <RequestCardSkeleton count={2} />
          ) : sent.length === 0 ? (
            <div className="bg-card border border-border/60 dark:border-border rounded-lg p-8 text-center text-muted-foreground shadow-card dark:shadow-none">
              No sent requests
            </div>
          ) : (
            sent.map((req) =>
              renderProfileCard(req.profile, req.skills, (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => handleCancelSent(req)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )
          )}
        </TabsContent>


        <TabsContent value="passed" className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">Passed Profiles</span>
          </div>
          {loading ? (
            <RequestCardSkeleton count={2} />
          ) : passed.length === 0 ? (
            <div className="bg-card border border-border/60 dark:border-border rounded-lg p-8 text-center text-muted-foreground shadow-card dark:shadow-none">
              No passed profiles
            </div>
          ) : (
            passed.map((p) =>
              renderProfileCard(p.profile, undefined, (
                <Button size="sm" variant="outline" onClick={() => handleUnpass(p)}>
                  Undo
                </Button>
              ))
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      {selectedUserForReview && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          reviewerId={userId}
          reviewedUserId={selectedUserForReview.userId}
          reviewedUserName={selectedUserForReview.name}
          existingReview={selectedUserForReview.existingReview}
          onReviewSubmitted={() => {
            setSelectedUserForReview(null);
          }}
        />
      )}
      </div>
    </>
  );
};

export default RequestsPanel;
