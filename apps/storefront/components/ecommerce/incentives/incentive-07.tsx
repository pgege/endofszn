import { cn } from "@/lib/utils"
import type { EcommerceIncentive } from "../types"

interface Incentive07Props {
  title?: string
  subtitle?: string
  incentives: EcommerceIncentive[]
  className?: string
}

function IncentiveVisual({ incentive }: { incentive: EcommerceIncentive }) {
  if (incentive.icon) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {incentive.icon}
      </div>
    )
  }
  if (incentive.imageSrc) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        <img
          src={incentive.imageSrc}
          alt=""
          className="h-8 w-8 object-contain"
        />
      </div>
    )
  }
  return null
}

export function Incentive07({
  title,
  subtitle,
  incentives,
  className,
}: Incentive07Props) {
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
            <div key={idx} className="flex gap-4">
              <IncentiveVisual incentive={incentive} />
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {incentive.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {incentive.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
