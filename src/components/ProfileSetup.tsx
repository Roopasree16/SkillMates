import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, GraduationCap, Briefcase, FileText, CalendarIcon, Camera } from "lucide-react";

interface ProfileSetupProps {
  onComplete: () => void;
  userId: string;
  existingProfile?: {
    full_name?: string;
    age?: number;
    gender?: string;
    education?: string;
    qualification?: string;
    bio?: string;
    avatar_url?: string;
  };
}

// Generate years from 1920 to current year
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);
const months = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

// Get days for a given month and year
const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const ProfileSetup = ({ onComplete, userId, existingProfile }: ProfileSetupProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(existingProfile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // DOB state with separate month, day, year
  const [dobMonth, setDobMonth] = useState<string>("");
  const [dobDay, setDobDay] = useState<string>("");
  const [dobYear, setDobYear] = useState<string>("");
  
  const [formData, setFormData] = useState({
    full_name: existingProfile?.full_name || "",
    gender: existingProfile?.gender || "",
    education: existingProfile?.education || "",
    qualification: existingProfile?.qualification || "",
    bio: existingProfile?.bio || "",
  });

  // Fetch existing DOB and avatar from database on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("date_of_birth, full_name, gender, education, qualification, bio, avatar_url")
        .eq("user_id", userId)
        .single();
      
      if (data) {
        if (data.date_of_birth) {
          const dob = new Date(data.date_of_birth);
          setDobMonth(dob.getMonth().toString());
          setDobDay(dob.getDate().toString());
          setDobYear(dob.getFullYear().toString());
        }
        setFormData({
          full_name: data.full_name || "",
          gender: data.gender || "",
          education: data.education || "",
          qualification: data.qualification || "",
          bio: data.bio || "",
        });
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      }
      setInitialLoading(false);
    };
    
    fetchProfile();
  }, [userId]);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setAvatarUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newAvatarUrl = urlData.publicUrl;
      setAvatarUrl(newAvatarUrl);

      // Update profile with new avatar URL
      await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("user_id", userId);

      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo.",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };
  
  // Calculate age from DOB
  const calculateAge = () => {
    if (!dobMonth || !dobDay || !dobYear) return null;
    const birthDate = new Date(parseInt(dobYear), parseInt(dobMonth), parseInt(dobDay));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge();

  // Get available days based on selected month and year
  const availableDays = dobMonth && dobYear 
    ? Array.from({ length: getDaysInMonth(parseInt(dobMonth), parseInt(dobYear)) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !dobMonth || !dobDay || !dobYear || !formData.gender || !formData.education) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const age = calculateAge();
    
    // Construct DOB date string
    const dateOfBirth = `${dobYear}-${String(parseInt(dobMonth) + 1).padStart(2, '0')}-${String(parseInt(dobDay)).padStart(2, '0')}`;
    
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        age: age,
        gender: formData.gender,
        education: formData.education,
        qualification: formData.qualification,
        bio: formData.bio,
        profile_completed: true,
        date_of_birth: dateOfBirth,
      })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Profile saved!",
      description: "Your profile has been created successfully.",
    });
    
    onComplete();
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        {/* Avatar with upload */}
        <div className="relative w-24 h-24 mx-auto mb-4 group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-secondary dark:border-primary/20 shadow-warm dark:shadow-glow"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent dark:bg-gradient-primary flex items-center justify-center border-4 border-secondary dark:border-primary/20 shadow-warm dark:shadow-glow">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent dark:bg-primary text-accent-foreground dark:text-primary-foreground flex items-center justify-center shadow-lg hover:bg-accent/90 dark:hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {avatarUploading ? (
              <div className="w-4 h-4 border-2 border-accent-foreground/30 dark:border-primary-foreground/30 border-t-accent-foreground dark:border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Complete Your Profile</h1>
        <p className="text-muted-foreground">
          Tell us about yourself to connect with the right skill partners
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-gradient-to-br from-card via-card to-secondary/30 dark:from-card dark:via-card dark:to-card border border-secondary/50 dark:border-border rounded-xl p-6 shadow-card dark:shadow-none">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2 text-foreground">
              <User className="w-4 h-4 text-accent dark:text-primary" />
              Full Name *
            </Label>
            <Input
              id="full_name"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="bg-background border-secondary/50 dark:border-border focus:border-accent dark:focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <CalendarIcon className="w-4 h-4 text-accent dark:text-primary" />
              Date of Birth * {calculatedAge !== null && <span className="text-muted-foreground">({calculatedAge} years old)</span>}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={dobMonth} onValueChange={setDobMonth}>
                <SelectTrigger className="bg-background border-secondary/50 dark:border-border focus:border-accent dark:focus:border-primary">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-secondary/50 dark:border-border max-h-[200px]">
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value} className="hover:bg-secondary/50 dark:hover:bg-muted">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dobDay} onValueChange={setDobDay}>
                <SelectTrigger className="bg-background border-secondary/50 dark:border-border focus:border-accent dark:focus:border-primary">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-secondary/50 dark:border-border max-h-[200px]">
                  {availableDays.map(day => (
                    <SelectItem key={day} value={day.toString()} className="hover:bg-secondary/50 dark:hover:bg-muted">
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dobYear} onValueChange={setDobYear}>
                <SelectTrigger className="bg-background border-secondary/50 dark:border-border focus:border-accent dark:focus:border-primary">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-secondary/50 dark:border-border max-h-[200px]">
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()} className="hover:bg-secondary/50 dark:hover:bg-muted">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-foreground">Gender *</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <SelectTrigger className="bg-background border-secondary/50 dark:border-border focus:border-accent dark:focus:border-primary">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-secondary/50 dark:border-border">
                <SelectItem value="male" className="hover:bg-secondary/50 dark:hover:bg-muted">Male</SelectItem>
                <SelectItem value="female" className="hover:bg-secondary/50 dark:hover:bg-muted">Female</SelectItem>
                <SelectItem value="other" className="hover:bg-secondary/50 dark:hover:bg-muted">Other</SelectItem>
                <SelectItem value="prefer-not-to-say" className="hover:bg-secondary/50 dark:hover:bg-muted">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="education" className="flex items-center gap-2 text-foreground">
              <GraduationCap className="w-4 h-4 text-accent dark:text-primary" />
              Education Level *
            </Label>
            <Select value={formData.education} onValueChange={(value) => setFormData({ ...formData, education: value })}>
              <SelectTrigger className="bg-background border-secondary/50 dark:border-border focus:border-accent dark:focus:border-primary">
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-secondary/50 dark:border-border">
                <SelectItem value="high-school" className="hover:bg-secondary/50 dark:hover:bg-muted">High School</SelectItem>
                <SelectItem value="bachelors" className="hover:bg-secondary/50 dark:hover:bg-muted">Bachelor's Degree</SelectItem>
                <SelectItem value="masters" className="hover:bg-secondary/50 dark:hover:bg-muted">Master's Degree</SelectItem>
                <SelectItem value="phd" className="hover:bg-secondary/50 dark:hover:bg-muted">PhD</SelectItem>
                <SelectItem value="self-taught" className="hover:bg-secondary/50 dark:hover:bg-muted">Self-taught</SelectItem>
                <SelectItem value="other" className="hover:bg-secondary/50 dark:hover:bg-muted">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualification" className="flex items-center gap-2 text-foreground">
            <Briefcase className="w-4 h-4 text-primary dark:text-primary" />
            Qualification / Current Role
          </Label>
          <Input
            id="qualification"
            placeholder="e.g., Software Developer, Student, Data Analyst..."
            value={formData.qualification}
            onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
            className="bg-background border-secondary/50 dark:border-border focus:border-accent dark:focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="flex items-center gap-2 text-foreground">
            <FileText className="w-4 h-4 text-primary dark:text-primary" />
            Bio
          </Label>
          <Textarea
            id="bio"
            placeholder="Tell others about yourself, your interests, and what you're looking to learn or teach..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="bg-background border-secondary/50 dark:border-border focus:border-accent dark:focus:border-primary min-h-[100px]"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-primary to-accent dark:from-primary dark:to-primary hover:from-primary/90 hover:to-accent/90 dark:hover:from-primary/90 dark:hover:to-primary/90 shadow-warm dark:shadow-glow" 
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue to Skills"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileSetup;
