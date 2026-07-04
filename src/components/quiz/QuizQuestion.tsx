import { Badge } from "@/components/ui/badge";

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

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | undefined;
  onAnswer: (answer: string) => void;
}

const QuizQuestion = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswer,
}: QuizQuestionProps) => {
  const difficultyColors: Record<string, string> = {
    beginner: "bg-green-500/20 text-green-400 border-green-500/30",
    intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    advanced: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </span>
        <Badge
          variant="outline"
          className={difficultyColors[question.difficulty] || difficultyColors.beginner}
        >
          {question.difficulty}
        </Badge>
      </div>

      <h3 className="text-lg font-medium text-foreground mb-6">{question.question}</h3>

      <div className="space-y-3">
        {(Object.entries(question.options) as [string, string][]).map(([key, value]) => (
          <button
            key={key}
            onClick={() => onAnswer(key)}
            className={`w-full p-4 rounded-lg border text-left transition-all ${
              selectedAnswer === key
                ? "bg-primary/20 border-primary text-foreground"
                : "bg-secondary/50 border-border text-foreground hover:bg-secondary hover:border-primary/30"
            }`}
          >
            <span className="font-medium text-primary mr-3">{key}.</span>
            {value}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizQuestion;
