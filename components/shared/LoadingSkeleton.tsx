'use client';

import { motion } from 'framer-motion';

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-[160px] sm:w-[200px] shrink-0">
      <div className="aspect-[2/3] w-full rounded-xl bg-surface-light shimmer overflow-hidden relative" />
      <div className="space-y-2 px-1">
        <div className="h-4 w-3/4 rounded bg-surface-light shimmer" />
        <div className="h-3 w-1/2 rounded bg-surface-light shimmer" />
      </div>
    </div>
  );
}

export function CategoryRowSkeleton() {
  return (
    <div className="w-full space-y-4 py-8">
      <div className="h-8 w-48 rounded bg-surface-light shimmer ml-4 md:ml-12" />
      <div className="flex gap-4 md:gap-6 overflow-hidden px-4 md:px-12">
        {[...Array(6)].map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[75vh] min-h-[600px] bg-surface-light shimmer">
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col gap-4 z-10">
        <div className="h-16 w-1/2 rounded bg-surface shimmer" />
        <div className="h-4 w-1/3 rounded bg-surface shimmer" />
        <div className="h-24 w-3/4 max-w-2xl rounded bg-surface shimmer" />
        <div className="flex gap-4 mt-4">
          <div className="h-12 w-32 rounded bg-surface shimmer" />
          <div className="h-12 w-32 rounded bg-surface shimmer" />
        </div>
      </div>
    </div>
  );
}
