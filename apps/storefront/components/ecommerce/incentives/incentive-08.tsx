import { cn } from "@/lib/utils"
import type { EcommerceIncentive } from "../types"

interface Incentive08Props {
  title?: string
  incentives: EcommerceIncentive[]
  className?: string
}

function IncentiveVisual({ incentive }: { incentive: EcommerceIncentive }) {
  if (incentive.icon) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {incentive.icon}
      </div>
    )
  }
  if (incentive.imageSrc) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        <img
          src={incentive.imageSrc}
          alt=""
          className="h-6 w-6 object-contain"
        />
      </div>
    )
  }
  return null
}

export function Incentive08({
  title,
  incentives,
  className,
}: Incentive08Props) {
  return (
    <section
      data-slot="incentive"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="mb-12 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
        )}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {incentives.map((incentive, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <IncentiveVisual incentive={incentive} />
              <h3 className="text-base font-semibold text-foreground">
                {incentive.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
