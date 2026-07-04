import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Award, RotateCcw } from "lucide-react";

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

interface QuizResultsProps {
  skillName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  questions: Question[];
  answers: Record<number, string>;
  onReset: () => void;
}

const QuizResults = ({
  skillName,
  score,
  correctAnswers,
  totalQuestions,
  passed,
  questions,
  answers,
  onReset,
}: QuizResultsProps) => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Result Header */}
      <div className={`text-center p-8 rounded-xl mb-8 ${
        passed ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"
      }`}>
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
          passed ? "bg-green-500/20" : "bg-red-500/20"
        }`}>
          {passed ? (
            <Award className="w-8 h-8 text-green-500" />
          ) : (
            <XCircle className="w-8 h-8 text-red-500" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          {passed ? "Congratulations!" : "Keep Learning!"}
        </h2>

        <p className="text-muted-foreground mb-4">
          {passed
            ? `You've verified your ${skillName} skills!`
            : `You need 70% to pass. Try again in 7 days.`}
        </p>

        <div className="text-4xl font-bold text-gradient mb-2">{score}%</div>
        <p className="text-sm text-muted-foreground">
          {correctAnswers} of {totalQuestions} correct
        </p>
      </div>

      {/* Answer Review */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-foreground">Review Answers</h3>
        {questions.map((q, index) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correct;

          return (
            <div
              key={q.id}
              className={`p-4 rounded-xl border ${
                isCorrect
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    Question {index + 1}
                  </p>
                  <p className="text-foreground mb-2">{q.question}</p>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Your answer: </span>
                      <span className={isCorrect ? "text-green-500" : "text-red-500"}>
                        {userAnswer}. {q.options[userAnswer as keyof typeof q.options]}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p>
                        <span className="text-muted-foreground">Correct answer: </span>
                        <span className="text-green-500">
                          {q.correct}. {q.options[q.correct as keyof typeof q.options]}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Button variant="hero" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          {passed ? "Verify Another Skill" : "Back to Skills"}
        </Button>
      </div>
    </div>
  );
};

export default QuizResults;
