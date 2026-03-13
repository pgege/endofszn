import { cn } from "@/lib/utils"
import type { EcommercePromo } from "../types"

interface PromoSection04Props {
  title?: string
  subtitle?: string
  promos: EcommercePromo[]
  className?: string
}

export function PromoSection04({
  title,
  subtitle,
  promos,
  className,
}: PromoSection04Props) {
  return (
    <section
      data-slot="promo-section"
      className={cn("relative overflow-visible bg-background py-20 sm:py-28", className)}
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo) => (
            <a
              key={promo.title}
              href={promo.href}
              className="group relative -mt-8 overflow-hidden rounded-lg border border-border shadow-lg first:mt-0 sm:first:mt-0"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={promo.imageSrc}
                  alt={promo.imageAlt ?? promo.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-6 pt-16">
                <h3 className="text-lg font-semibold text-primary-foreground">
                  {promo.title}
                </h3>
                {promo.description && (
                  <p className="mt-1 text-sm text-primary-foreground/90">
                    {promo.description}
                  </p>
                )}
                {promo.cta && (
                  <span className="mt-2 inline-block text-sm font-medium text-primary-foreground underline underline-offset-4">
                    {promo.cta}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
