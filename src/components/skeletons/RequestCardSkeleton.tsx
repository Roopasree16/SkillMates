import { Skeleton } from "@/components/ui/skeleton";

interface RequestCardSkeletonProps {
  count?: number;
}

const RequestCardSkeleton = ({ count = 3 }: RequestCardSkeletonProps) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-lg p-4 flex items-start gap-4"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestCardSkeleton;
