import { cn } from "@/lib/utils"
import type { EcommerceIncentive } from "../types"

interface Incentive03Props {
  title?: string
  subtitle?: string
  incentives: EcommerceIncentive[]
  className?: string
}

function IncentiveVisual({ incentive }: { incentive: EcommerceIncentive }) {
  if (incentive.icon) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {incentive.icon}
      </div>
    )
  }
  if (incentive.imageSrc) {
    return (
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        <img
          src={incentive.imageSrc}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    )
  }
  return null
}

export function Incentive03({
  title,
  subtitle,
  incentives,
  className,
}: Incentive03Props) {
  return (
    <section
      data-slot="incentive"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-12 text-center">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {incentives.map((incentive, idx) => (
            <div key={idx} className="flex flex-col">
              <IncentiveVisual incentive={incentive} />
              <h3 className="mt-6 text-lg font-semibold text-foreground">
                {incentive.name}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {incentive.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
