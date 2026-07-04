import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PageBackground from "@/components/ui/PageBackground";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsSignUp(searchParams.get("mode") === "signup");
  }, [searchParams]);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!email || !password || (isSignUp && !fullName)) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          setIsLoading(false);
          return;
        }

        toast({
          title: "Account created!",
          description: "Welcome to SkillMates!",
        });
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login")) {
            toast({
              title: "Invalid credentials",
              description: "Email or password is incorrect.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          setIsLoading(false);
          return;
        }

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageBackground variant="auth">
      <div className="min-h-screen flex items-center justify-center p-6">
        {/* Decorative elements - warm tones for light mode */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-secondary/40 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-accent/20 dark:bg-primary/15 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-all duration-300 group animate-fade-in"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          <div className="relative animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            {/* Glow effect behind card - warm gradient for light mode */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/60 via-primary/30 to-accent/40 dark:from-primary/40 dark:via-primary/20 dark:to-primary/40 rounded-2xl blur-lg opacity-60" />
            
            {/* Main card - warm styling for light mode */}
            <div className="relative bg-gradient-to-br from-card via-card to-secondary/30 dark:from-card dark:via-card dark:to-card/90 backdrop-blur-xl border border-secondary/50 dark:border-primary/10 rounded-2xl p-8 shadow-card dark:shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-5">
                  <div className="absolute inset-0 bg-secondary/60 dark:bg-primary/40 rounded-xl blur-lg" />
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                    <Sparkles className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h1>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-secondary/30 dark:bg-secondary/50 border-secondary/50 dark:border-border h-11 rounded-xl transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary/30 dark:bg-secondary/50 border-secondary/50 dark:border-border h-11 rounded-xl transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-secondary/30 dark:bg-secondary/50 border-secondary/50 dark:border-border h-11 rounded-xl pr-11 transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full h-11 rounded-xl font-semibold mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Please wait...
                    </span>
                  ) : (
                    isSignUp ? "Sign Up" : "Sign In"
                  )}
                </Button>
              </form>

              {/* Toggle sign in/up */}
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:text-primary/80 font-semibold ml-1.5 hover:underline underline-offset-4 transition-all"
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
};

export default Auth;
