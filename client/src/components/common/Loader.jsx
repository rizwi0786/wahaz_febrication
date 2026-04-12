import clsx from 'clsx';

export default function Loader({ size = 'md', className }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin',
          sizes[size]
        )}
      />
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={clsx('skeleton rounded-md', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-64 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
