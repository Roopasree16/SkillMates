import { Skeleton } from "@/components/ui/skeleton";

const MatchCardSkeleton = () => {
  return (
    <div className="relative bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 rounded-2xl p-6 shadow-xl shadow-primary/5 overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Bio */}
        <div className="bg-background/30 rounded-lg p-3 border border-border/30 mb-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Skills grid */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Can Teach */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>

          {/* Wants to Learn */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-18 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-10 rounded-md" />
          <Skeleton className="flex-1 h-10 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default MatchCardSkeleton;
