import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewerId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  };
  onReviewSubmitted: () => void;
}

const ReviewDialog = ({
  open,
  onOpenChange,
  reviewerId,
  reviewedUserId,
  reviewedUserName,
  existingReview,
  onReviewSubmitted,
}: ReviewDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (existingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({
            rating,
            comment: comment.trim() || null,
          })
          .eq("id", existingReview.id);

        if (error) throw error;
        toast({ title: "Review updated", description: "Your review has been updated" });
      } else {
        const { error } = await supabase.from("reviews").insert({
          reviewer_id: reviewerId,
          reviewed_user_id: reviewedUserId,
          rating,
          comment: comment.trim() || null,
        });

        if (error) throw error;
        toast({ title: "Review submitted", description: "Thank you for your feedback!" });
      }

      onReviewSubmitted();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Edit Review" : "Leave a Review"}
          </DialogTitle>
          <DialogDescription>
            Share your experience with {reviewedUserName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-muted-foreground">Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      (hoveredRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="text-sm font-medium text-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </span>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">
              Comment (optional)
            </span>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <span className="text-xs text-muted-foreground">
              {comment.length}/500
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : existingReview ? "Update" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
