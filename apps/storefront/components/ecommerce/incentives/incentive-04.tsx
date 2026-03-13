import { cn } from "@/lib/utils"
import type { EcommerceIncentive } from "../types"

interface Incentive04Props {
  title?: string
  incentives: EcommerceIncentive[]
  className?: string
}

function IncentiveVisual({ incentive }: { incentive: EcommerceIncentive }) {
  if (incentive.icon) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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

export function Incentive04({
  title,
  incentives,
  className,
}: Incentive04Props) {
  return (
    <section
      data-slot="incentive"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
        )}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {incentives.map((incentive, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
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
