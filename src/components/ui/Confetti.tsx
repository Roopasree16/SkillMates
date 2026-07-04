import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
  variant?: "confetti" | "sparkle";
}

const COLORS = [
  "hsl(263 70% 58%)", // primary purple
  "hsl(280 80% 60%)", // magenta
  "hsl(142 70% 45%)", // green (success)
  "hsl(38 92% 50%)",  // gold
  "hsl(200 80% 55%)", // blue
  "hsl(330 80% 60%)", // pink
];

const Confetti = ({ isActive, onComplete, variant = "confetti" }: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: variant === "sparkle" ? 20 : 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: variant === "sparkle" ? 4 + Math.random() * 6 : 6 + Math.random() * 8,
        rotation: Math.random() * 360,
      }));
      setPieces(newPieces);

      const timeout = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [isActive, onComplete, variant]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={cn(
            "absolute animate-confetti-fall",
            variant === "sparkle" && "rounded-full"
          )}
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            width: variant === "sparkle" ? piece.size : piece.size,
            height: variant === "sparkle" ? piece.size : piece.size * 0.6,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            boxShadow: variant === "sparkle" ? `0 0 ${piece.size}px ${piece.color}` : "none",
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
