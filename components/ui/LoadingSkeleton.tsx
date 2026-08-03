export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[90vh] min-h-[700px] flex items-end bg-[#0A0C10] animate-pulse">
      <div className="absolute inset-0 bg-surface-light/50" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />
      
      <div className="relative z-10 w-full px-4 md:px-12 lg:px-16 pb-16 md:pb-24">
        <div className="max-w-2xl space-y-6">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-16 md:h-24 bg-white/10 rounded w-3/4" />
          <div className="h-5 bg-white/10 rounded w-1/2" />
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-5/6" />
            <div className="h-4 bg-white/10 rounded w-4/6" />
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-12 bg-white/20 rounded w-32" />
            <div className="h-12 bg-white/10 rounded w-32" />
            <div className="h-12 bg-white/10 rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton({ variant = 'portrait' }: { variant?: 'portrait' | 'landscape' }) {
  const isLandscape = variant === 'landscape';
  return (
    <div className="w-full py-6">
      <div className="mb-4 px-4 md:px-12">
        <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
      </div>
      <div className="flex gap-4 overflow-hidden px-4 md:px-12 pb-8 pt-4">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={`rounded-md bg-white/5 animate-pulse shrink-0 ${
              isLandscape 
                ? 'w-[200px] sm:w-[260px] md:w-[320px] aspect-video' 
                : 'w-[120px] sm:w-[150px] md:w-[170px] aspect-[2/3]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
