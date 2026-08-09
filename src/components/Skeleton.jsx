export function SkeletonRows({ count = 3, height = 56 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton" style={{ height }} />
      ))}
    </div>
  )
}

export function SkeletonBlock({ height = 220 }) {
  return <div className="skeleton" style={{ height, borderRadius: 20 }} />
}
