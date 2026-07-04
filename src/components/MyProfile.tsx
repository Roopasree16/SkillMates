import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Edit2, GraduationCap, Target, MessageSquare, Star, CheckCircle2, Trash2, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface MyProfileProps {
  profile: Profile;
  userSkillsHave: Skill[];
  userSkillsLearn: Skill[];
  verifications: Verification[];
  onBack: () => void;
  onEdit: () => void;
  onManageSkills: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

const MyProfile = ({ 
  profile, 
  userSkillsHave, 
  userSkillsLearn, 
  verifications, 
  onBack, 
  onEdit, 
  onManageSkills 
}: MyProfileProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const displayName = profile.full_name || "User";
  
  const isSkillVerified = (skillId: string) => {
    return verifications.some(v => v.skill_id === skillId && v.passed);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id")
        .eq("reviewed_user_id", profile.user_id)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        // Fetch reviewer profiles
        const reviewerIds = data.map(r => r.reviewer_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", reviewerIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const enrichedReviews: Review[] = data.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer_profile: profileMap.get(r.reviewer_id),
        }));

        setReviews(enrichedReviews);
      }
      setLoadingReviews(false);
    };

    fetchReviews();
  }, [profile.user_id]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;

      // Session may still exist locally; clear it
      await supabase.auth.signOut();

      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully. Please sign up again to use the app.",
      });

      navigate("/auth");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2 hover:bg-secondary/50 dark:hover:bg-secondary/20">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold text-primary">My Profile</h1>
        <Button variant="ghost" onClick={onEdit} className="gap-2 hover:bg-secondary/50 dark:hover:bg-secondary/20">
          <Edit2 className="w-4 h-4" />
          Edit
        </Button>
      </div>

      {/* Profile Card - warm styling */}
      <Card className="mb-6 border-secondary/50 dark:border-border bg-gradient-to-br from-card via-card to-secondary/30 dark:from-card dark:via-card dark:to-card shadow-card dark:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-secondary/60 dark:border-primary/20 shadow-warm dark:shadow-none"
              />
            ) : (
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-secondary/60 dark:border-primary/20 shadow-warm dark:shadow-none",
                getAvatarColor(displayName)
              )}>
                {getInitials(displayName)}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">{displayName}</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.qualification && (
                  <Badge variant="secondary" className="bg-secondary/70 dark:bg-secondary/50 border-secondary/50">
                    {profile.qualification}
                  </Badge>
                )}
                {profile.age && (
                  <Badge variant="secondary" className="bg-secondary/70 dark:bg-secondary/50 border-secondary/50">
                    {profile.age} years old
                  </Badge>
                )}
                {profile.gender && (
                  <Badge variant="secondary" className="bg-secondary/70 dark:bg-secondary/50 border-secondary/50">
                    {profile.gender}
                  </Badge>
                )}
              </div>
              {profile.bio && (
                <p className="text-muted-foreground text-sm">{profile.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Skills I Can Teach */}
        <Card className="border-secondary/50 dark:border-border bg-gradient-to-br from-card via-card to-accent/10 dark:from-card dark:via-card dark:to-card shadow-card dark:shadow-lg hover:border-accent/40 dark:hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-accent/15 dark:bg-primary/15">
                <GraduationCap className="w-5 h-5 text-accent dark:text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Skills I Can Teach</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {userSkillsHave.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              ) : (
                userSkillsHave.map(skill => (
                  <Badge 
                    key={skill.id} 
                    variant="outline"
                    className="border-accent/40 dark:border-primary/30 text-accent dark:text-primary bg-accent/10 dark:bg-transparent gap-1"
                  >
                    {skill.name}
                    {isSkillVerified(skill.id) && (
                      <CheckCircle2 className="w-3 h-3 text-accent dark:text-emerald-500" />
                    )}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills I Want to Learn */}
        <Card className="border-secondary/50 dark:border-border bg-gradient-to-br from-card via-card to-secondary/30 dark:from-card dark:via-card dark:to-card shadow-card dark:shadow-lg hover:border-secondary dark:hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/15">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Skills I Want to Learn</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {userSkillsLearn.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              ) : (
                userSkillsLearn.map(skill => (
                  <Badge 
                    key={skill.id} 
                    variant="outline"
                    className="border-primary/30 text-primary bg-primary/10 dark:bg-transparent"
                  >
                    {skill.name}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <Card className="mb-6 border-secondary/50 dark:border-border bg-gradient-to-br from-card via-card to-secondary/20 dark:from-card dark:via-card dark:to-card shadow-card dark:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-secondary/50 dark:bg-primary/15">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Reviews</h3>
            </div>
            {averageRating && (
              <div className="flex items-center gap-1 bg-secondary/50 dark:bg-secondary/20 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">{averageRating}</span>
                <span className="text-sm text-muted-foreground">({reviews.length})</span>
              </div>
            )}
          </div>
          
          {loadingReviews ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="text-center py-6 bg-secondary/20 dark:bg-secondary/10 rounded-xl">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No reviews yet. Reviews from other users will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-t border-secondary/30 dark:border-border pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border-2 border-secondary/50 dark:border-transparent">
                      <AvatarImage src={review.reviewer_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary/50 dark:bg-secondary text-foreground">
                        {review.reviewer_profile?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground">
                          {review.reviewer_profile?.full_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex gap-0.5 my-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "w-3 h-3",
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="border-secondary/50 dark:border-border bg-gradient-to-br from-card via-card to-secondary/20 dark:from-card dark:via-card dark:to-card shadow-card dark:shadow-lg">
        <CardContent className="p-6 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Button onClick={onManageSkills} className="w-full shadow-warm dark:shadow-lg">
              Manage Skills
            </Button>
            <Button variant="outline" onClick={onEdit} className="w-full border-secondary/50 dark:border-border hover:bg-secondary/50 dark:hover:bg-secondary/20">
              Edit Profile
            </Button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2" disabled={deleting}>
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete Account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-secondary/50 dark:border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data from our servers, including your profile, skills,
                  verifications, and shared resources.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-secondary/50 dark:border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProfile;
