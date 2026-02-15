export function ImagesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-7 w-48 bg-muted mb-1" /><div className="h-5 w-64 bg-muted" /></div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-muted" />)}
        <div className="aspect-square border-2 border-dashed border-muted-foreground/20" />
      </div>
    </div>
  )
}

export function VariantsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-7 w-44 bg-muted mb-1" /><div className="h-5 w-56 bg-muted" /></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border">
            <div className="h-5 w-24 bg-muted" /><div className="h-9 flex-1 bg-muted" /><div className="h-9 w-20 bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function OptionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-7 w-52 bg-muted mb-1" /><div className="h-5 w-72 bg-muted" /></div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="p-4 border space-y-3">
          <div className="h-5 w-20 bg-muted" />
          <div className="flex gap-2">{[...Array(3)].map((_, j) => <div key={j} className="h-8 w-16 bg-muted" />)}</div>
        </div>
      ))}
      <div className="h-10 w-36 bg-muted" />
    </div>
  )
}

export function PreviewSkeleton() {
  return (
    <div className="grid lg:grid-cols-2 gap-8 animate-pulse">
      <div className="space-y-3">
        <div className="aspect-square bg-muted" />
        <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 w-16 bg-muted" />)}</div>
      </div>
      <div className="space-y-6">
        <div><div className="h-9 w-3/4 bg-muted mb-3" /><div className="h-9 w-32 bg-muted" /></div>
        <div className="space-y-2"><div className="h-4 w-full bg-muted" /><div className="h-4 w-5/6 bg-muted" /><div className="h-4 w-2/3 bg-muted" /></div>
        <div className="space-y-2">
          <div className="h-5 w-16 bg-muted" />
          <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 w-14 bg-muted" />)}</div>
        </div>
        <div className="h-12 w-full bg-muted" />
      </div>
    </div>
  )
}

export function CustomerPreviewSkeleton() {
  return (
    <div className="bg-background border p-4 space-y-4 animate-pulse">
      <div className="flex items-center gap-2"><div className="h-3.5 w-3.5 bg-muted" /><div className="h-3 w-24 bg-muted" /></div>
      <div className="aspect-square bg-muted" />
      <div><div className="h-6 w-3/4 bg-muted mb-2" /><div className="h-7 w-24 bg-muted" /></div>
      <div className="space-y-2"><div className="h-4 w-full bg-muted" /><div className="h-4 w-4/5 bg-muted" /></div>
      <div className="space-y-2">
        <div className="h-4 w-12 bg-muted" />
        <div className="flex gap-2">{[...Array(3)].map((_, i) => <div key={i} className="h-9 w-12 bg-muted" />)}</div>
      </div>
      <div className="h-11 w-full bg-muted" />
    </div>
  )
}
