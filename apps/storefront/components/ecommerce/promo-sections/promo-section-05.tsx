import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PromoSection05Props {
  imageSrc: string
  imageAlt?: string
  title: string
  description?: string
  ctaText?: string
  ctaHref?: string
  className?: string
}

export function PromoSection05({
  imageSrc,
  imageAlt,
  title,
  description,
  ctaText,
  ctaHref,
  className,
}: PromoSection05Props) {
  return (
    <section
      data-slot="promo-section"
      className={cn("overflow-hidden bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl">
          <div
            className="aspect-[21/9] bg-cover bg-center"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
          <div className="absolute inset-0 bg-foreground/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl md:text-4xl">
              {title}
            </h2>
            {description && (
              <p className="mx-auto mt-3 max-w-xl text-base text-primary-foreground/90">
                {description}
              </p>
            )}
            {ctaText && ctaHref && (
              <Button asChild size="lg" className="mt-6">
                <a href={ctaHref}>{ctaText}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
