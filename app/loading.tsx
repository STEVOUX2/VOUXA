import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function RootLoading() {
  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" showText={true} />
    </div>
  );
}
