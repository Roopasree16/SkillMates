import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥"];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

const EmojiPicker = ({ onSelect, trigger }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <Smile className="w-4 h-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top" align="center">
        <div className="flex gap-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              className="text-xl hover:bg-muted rounded p-1 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
