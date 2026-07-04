import { Skeleton } from "@/components/ui/skeleton";

const ChatListSkeleton = () => {
  return (
    <div className="p-2 space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl border border-transparent"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatListSkeleton;
