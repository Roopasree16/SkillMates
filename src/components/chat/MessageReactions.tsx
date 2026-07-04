import { cn } from "@/lib/utils";

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
  isOwn: boolean;
}

const MessageReactions = ({ reactions, onToggleReaction, isOwn }: MessageReactionsProps) => {
  if (reactions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggleReaction(reaction.emoji)}
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors",
            reaction.hasReacted
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted"
          )}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
};

export default MessageReactions;
