export default function PosterSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton skeleton-poster" />
          <div className="skeleton skeleton-text mt-2 w-3/4" />
          <div className="skeleton skeleton-text mt-1 w-1/2" />
        </div>
      ))}
    </div>
  );
}
