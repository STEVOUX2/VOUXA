import { HeroSkeleton, RowSkeleton } from '@/components/ui/LoadingSkeleton';

export default function TvDetailLoading() {
  return (
    <div className="w-full bg-background min-h-screen pb-24">
      <HeroSkeleton />
      <div className="mt-8 max-w-[1800px] mx-auto">
        <RowSkeleton variant="landscape" />
      </div>
    </div>
  );
}
