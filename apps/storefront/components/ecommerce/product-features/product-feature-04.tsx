import { cn } from "@/lib/utils"
import type { EcommerceProductFeature } from "../types"

interface ProductFeature04Props {
  title?: string
  features: EcommerceProductFeature[]
  className?: string
}

export function ProductFeature04({
  title,
  features,
  className,
}: ProductFeature04Props) {
  return (
    <section
      data-slot="product-feature"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
        )}
        <div className="mt-16 space-y-24">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16",
                idx % 2 === 1 && "lg:flex-row-reverse"
              )}
            >
              {feature.imageSrc && (
                <div className="flex-1 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={feature.imageSrc}
                    alt={feature.imageAlt ?? feature.name}
                    className="aspect-[21/9] w-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
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
