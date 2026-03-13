import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PromoSection08Props {
  imageSrc: string
  imageAlt?: string
  title: string
  description?: string
  ctaText?: string
  ctaHref?: string
  className?: string
}

export function PromoSection08({
  imageSrc,
  imageAlt,
  title,
  description,
  ctaText,
  ctaHref,
  className,
}: PromoSection08Props) {
  return (
    <section
      data-slot="promo-section"
      className={cn("relative w-full overflow-hidden", className)}
    >
      <div className="absolute inset-0">
        <img
          src={imageSrc}
          alt={imageAlt ?? title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/30" />
      </div>
      <div className="relative mx-auto flex min-h-[32rem] max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:min-h-[40rem] sm:px-6 sm:py-40 lg:px-8">
        <h2 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mt-6 max-w-2xl text-xl text-primary-foreground/90 sm:text-2xl">
            {description}
          </p>
        )}
        {ctaText && ctaHref && (
          <Button asChild size="lg" className="mt-10">
            <a href={ctaHref}>{ctaText}</a>
          </Button>
        )}
      </div>
    </section>
  )
}
