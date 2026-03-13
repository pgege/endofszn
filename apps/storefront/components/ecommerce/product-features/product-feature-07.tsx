import { cn } from "@/lib/utils"
import type { EcommerceProductFeature } from "../types"

interface ProductFeature07Props {
  title?: string
  subtitle?: string
  features: EcommerceProductFeature[]
  className?: string
}

export function ProductFeature07({
  title,
  subtitle,
  features,
  className,
}: ProductFeature07Props) {
  return (
    <section
      data-slot="product-feature"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {subtitle && (
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {subtitle}
            </p>
          )}
          {title && (
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h2>
          )}
        </div>
        <div className="mt-16 space-y-24">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={cn(
                "grid items-center gap-12 lg:grid-cols-2 lg:gap-16",
                idx % 2 === 1 && "lg:[&>*:first-child]:order-2"
              )}
            >
              {feature.imageSrc && (
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  <img
                    src={feature.imageSrc}
                    alt={feature.imageAlt ?? feature.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.name}
                </h3>
                <p className="mt-4 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
