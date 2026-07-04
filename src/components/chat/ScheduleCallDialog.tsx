import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduleCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  userId: string;
  otherUserName: string;
}

const ScheduleCallDialog = ({
  open,
  onOpenChange,
  conversationId,
  userId,
  otherUserName,
}: ScheduleCallDialogProps) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("12:00");
  const [callType, setCallType] = useState("video");
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!date) return;

    setLoading(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      if (scheduledAt <= new Date()) {
        toast({
          title: "Invalid time",
          description: "Please select a future date and time",
          variant: "destructive",
        });
        return;
      }

      await supabase.from("scheduled_calls").insert({
        conversation_id: conversationId,
        scheduled_by: userId,
        scheduled_at: scheduledAt.toISOString(),
        call_type: callType,
      });

      toast({
        title: "Call scheduled",
        description: `${callType === "video" ? "Video" : "Voice"} call scheduled with ${otherUserName}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule a Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Call Type</Label>
            <Select value={callType} onValueChange={setCallType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="voice">Voice Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <Button onClick={handleSchedule} disabled={loading} className="w-full">
            {loading ? "Scheduling..." : "Schedule Call"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleCallDialog;
