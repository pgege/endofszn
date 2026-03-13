import { cn } from "@/lib/utils"
import type { EcommerceProductFeature } from "../types"

interface ProductFeature05Props {
  title?: string
  subtitle?: string
  imageSrc?: string
  imageAlt?: string
  features: EcommerceProductFeature[]
  className?: string
}

export function ProductFeature05({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  features,
  className,
}: ProductFeature05Props) {
  return (
    <section
      data-slot="product-feature"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {imageSrc && (
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted lg:aspect-square">
              <img
                src={imageSrc}
                alt={imageAlt ?? ""}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
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
            <ul className="mt-10 space-y-8">
              {features.map((feature, idx) => (
                <li key={idx} className="flex gap-4">
                  {feature.icon && (
                    <div className="shrink-0 text-muted-foreground">
                      {feature.icon}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {feature.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
