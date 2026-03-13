import { cn } from "@/lib/utils"
import type { EcommerceOffer } from "../types"

interface PromoSection07Props {
  offers?: EcommerceOffer[]
  imageSrc: string
  imageAlt?: string
  title?: string
  className?: string
}

export function PromoSection07({
  offers = [],
  imageSrc,
  imageAlt,
  title,
  className,
}: PromoSection07Props) {
  return (
    <section
      data-slot="promo-section"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-center">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h2>
            )}
            {offers.length > 0 && (
              <ul className="mt-8 space-y-6">
                {offers.map((offer) => (
                  <li key={offer.name}>
                    <a
                      href={offer.href}
                      className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary">
                          {offer.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {offer.description}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-primary">
                        Shop →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative overflow-hidden rounded-xl">
            <img
              src={imageSrc}
              alt={imageAlt ?? title ?? "Promotional image"}
              className="aspect-[4/3] w-full object-cover lg:aspect-square"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
