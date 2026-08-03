import { HeroSkeleton, RowSkeleton } from '@/components/ui/LoadingSkeleton';

export default function MovieDetailLoading() {
  return (
    <div className="w-full bg-background min-h-screen pb-24">
      <HeroSkeleton />
      <div className="mt-8 max-w-[1800px] mx-auto">
        <RowSkeleton variant="portrait" />
      </div>
    </div>
  );
}
