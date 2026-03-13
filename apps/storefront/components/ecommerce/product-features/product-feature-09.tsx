import { cn } from "@/lib/utils"
import type { EcommerceProductFeature } from "../types"

interface ProductFeature09Props {
  title?: string
  subtitle?: string
  description?: string
  mainImage?: { src: string; alt: string }
  sideImages?: { src: string; alt: string }[]
  features: EcommerceProductFeature[]
  className?: string
}

export function ProductFeature09({
  title,
  subtitle,
  description,
  mainImage,
  sideImages = [],
  features,
  className,
}: ProductFeature09Props) {
  return (
    <section
      data-slot="product-feature"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex gap-4">
            {mainImage && (
              <div className="flex-1 overflow-hidden rounded-lg bg-muted">
                <img
                  src={mainImage.src}
                  alt={mainImage.alt}
                  className="aspect-[3/4] h-full w-full object-cover"
                />
              </div>
            )}
            {sideImages.length > 0 && (
              <div className="flex flex-col gap-4">
                {sideImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square w-24 overflow-hidden rounded-lg bg-muted sm:w-32"
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
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
            {description && (
              <p className="mt-6 text-base text-muted-foreground">
                {description}
              </p>
            )}
            <ul className="mt-10 space-y-6">
              {features.map((feature, idx) => (
                <li key={idx}>
                  <h3 className="font-semibold text-foreground">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
