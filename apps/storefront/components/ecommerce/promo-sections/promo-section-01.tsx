import { cn } from "@/lib/utils"
import type { EcommercePromo } from "../types"

interface PromoSection01Props {
  title?: string
  subtitle?: string
  promos: EcommercePromo[]
  className?: string
}

export function PromoSection01({
  title,
  subtitle,
  promos,
  className,
}: PromoSection01Props) {
  return (
    <section
      data-slot="promo-section"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-10 text-center">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo) => (
            <a
              key={promo.title}
              href={promo.href}
              className="group relative block aspect-[4/3] overflow-hidden rounded-lg"
            >
              <img
                src={promo.imageSrc}
                alt={promo.imageAlt ?? promo.title}
                className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/40 p-6 text-center transition-colors group-hover:bg-foreground/50">
                <h3 className="text-xl font-semibold text-primary-foreground drop-shadow-sm">
                  {promo.title}
                </h3>
                {promo.description && (
                  <p className="mt-1 text-sm text-primary-foreground/90">
                    {promo.description}
                  </p>
                )}
                {promo.cta && (
                  <span className="mt-3 text-sm font-medium text-primary-foreground underline underline-offset-4">
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
