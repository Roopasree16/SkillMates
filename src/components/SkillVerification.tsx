import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Award, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import SkillSelector from "./quiz/SkillSelector";
import QuizQuestion from "./quiz/QuizQuestion";
import QuizResults from "./quiz/QuizResults";

interface Skill {
  id: string;
  name: string;
  category: string | null;
}

interface Verification {
  skill_id: string;
  passed: boolean;
  score: number;
  next_attempt_at: string | null;
}

interface Question {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: string;
  difficulty: string;
}

interface QuizData {
  skill: string;
  questions: Question[];
}

interface SkillVerificationProps {
  preSelectedSkill?: {
    id: string;
    name: string;
    category: string;
  };
  onComplete?: () => void;
  userSkills?: Skill[];
}

const SkillVerification = ({ preSelectedSkill, onComplete, userSkills }: SkillVerificationProps = {}) => {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-start quiz if preSelectedSkill is provided
    if (preSelectedSkill && !loading && skills.length > 0) {
      const skill = skills.find(s => s.id === preSelectedSkill.id);
      if (skill) {
        startQuiz(skill);
      }
    }
  }, [preSelectedSkill, loading, skills]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // If userSkills is provided, use those instead of fetching all skills
      if (userSkills && userSkills.length > 0) {
        setSkills(userSkills);
      } else {
        // Fetch user's "can teach" skills from user_skills table
        const { data: userSkillsData } = await supabase
          .from("user_skills")
          .select("skill_id, skills(*)")
          .eq("user_id", user.id)
          .eq("skill_type", "have");

        if (userSkillsData) {
          const skillsList = userSkillsData
            .map(us => us.skills as unknown as Skill)
            .filter(Boolean);
          setSkills(skillsList);
        }
      }

      const { data: verificationsData } = await supabase
        .from("skill_verifications")
        .select("*")
        .eq("user_id", user.id);

      if (verificationsData) setVerifications(verificationsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillStatus = (skillId: string) => {
    const verification = verifications.find((v) => v.skill_id === skillId);
    if (!verification) return "not_attempted";
    if (verification.passed) return "passed";
    if (verification.next_attempt_at && new Date(verification.next_attempt_at) > new Date()) {
      return "cooldown";
    }
    return "failed";
  };

  const getCooldownRemaining = (skillId: string) => {
    const verification = verifications.find((v) => v.skill_id === skillId);
    if (!verification?.next_attempt_at) return null;
    const nextAttempt = new Date(verification.next_attempt_at);
    const now = new Date();
    if (nextAttempt <= now) return null;
    const days = Math.ceil((nextAttempt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const startQuiz = async (skill: Skill) => {
    const status = getSkillStatus(skill.id);
    if (status === "cooldown") {
      const days = getCooldownRemaining(skill.id);
      toast({
        title: "Cooldown Active",
        description: `You can retry this skill in ${days} day(s).`,
        variant: "destructive",
      });
      return;
    }

    setSelectedSkill(skill);
    setGeneratingQuiz(true);
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-skill-test", {
        body: { skill: skill.name },
      });

      if (error) throw error;
      if (!data || !data.questions) throw new Error("Invalid quiz data received");

      setQuizData(data);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
      setSelectedSkill(null);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (quizData && currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const submitQuiz = async () => {
    if (!quizData || !selectedSkill || !userId) return;

    const correctAnswers = quizData.questions.filter(
      (q) => answers[q.id] === q.correct
    ).length;
    const score = Math.round((correctAnswers / quizData.questions.length) * 100);
    const passed = score >= 80; // 80% to pass

    try {
      const existingVerification = verifications.find(
        (v) => v.skill_id === selectedSkill.id
      );

      const verificationData = {
        user_id: userId,
        skill_id: selectedSkill.id,
        passed,
        score,
        attempted_at: new Date().toISOString(),
        next_attempt_at: passed ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (existingVerification) {
        await supabase
          .from("skill_verifications")
          .update(verificationData)
          .eq("user_id", userId)
          .eq("skill_id", selectedSkill.id);
      } else {
        await supabase.from("skill_verifications").insert(verificationData);
      }

      // Refresh verifications
      const { data } = await supabase
        .from("skill_verifications")
        .select("*")
        .eq("user_id", userId);
      if (data) setVerifications(data);

      setShowResults(true);
    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        title: "Error",
        description: "Failed to save results. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetQuiz = () => {
    setSelectedSkill(null);
    setQuizData(null);
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Show results
  if (showResults && quizData && selectedSkill) {
    const correctAnswers = quizData.questions.filter(
      (q) => answers[q.id] === q.correct
    ).length;
    const score = Math.round((correctAnswers / quizData.questions.length) * 100);
    const passed = score >= 80;

    return (
      <QuizResults
        skillName={selectedSkill.name}
        score={score}
        correctAnswers={correctAnswers}
        totalQuestions={quizData.questions.length}
        passed={passed}
        questions={quizData.questions}
        answers={answers}
        onReset={resetQuiz}
      />
    );
  }

  // Show quiz
  if (selectedSkill && quizData) {
    const question = quizData.questions[currentQuestion];
    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount === quizData.questions.length;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-foreground">
              {selectedSkill.name} Verification
            </h2>
            <span className="text-sm text-muted-foreground">
              {answeredCount}/{quizData.questions.length} answered
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <QuizQuestion
          question={question}
          questionNumber={currentQuestion + 1}
          totalQuestions={quizData.questions.length}
          selectedAnswer={answers[question.id]}
          onAnswer={(answer) => handleAnswer(question.id, answer)}
        />

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestion < quizData.questions.length - 1 ? (
              <Button onClick={nextQuestion}>Next</Button>
            ) : (
              <Button
                variant="hero"
                onClick={submitQuiz}
                disabled={!allAnswered}
              >
                Submit Quiz
              </Button>
            )}
          </div>
        </div>

        {/* Question navigator */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {quizData.questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                index === currentQuestion
                  ? "bg-primary text-primary-foreground"
                  : answers[q.id]
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Generating quiz loading state
  if (generatingQuiz) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Generating Your Quiz...
        </h2>
        <p className="text-muted-foreground">
          AI is creating personalized questions for {selectedSkill?.name}
        </p>
      </div>
    );
  }

  // Skill selection - only show user's "can teach" skills
  return (
    <SkillSelector
      skills={skills}
      getSkillStatus={getSkillStatus}
      getCooldownRemaining={getCooldownRemaining}
      onSelectSkill={startQuiz}
    />
  );
};

export default SkillVerification;
