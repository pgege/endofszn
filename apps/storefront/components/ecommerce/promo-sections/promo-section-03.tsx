import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PromoSection03Props {
  imageSrc: string
  imageAlt?: string
  title: string
  description?: string
  ctaText?: string
  ctaHref?: string
  className?: string
}

export function PromoSection03({
  imageSrc,
  imageAlt,
  title,
  description,
  ctaText,
  ctaHref,
  className,
}: PromoSection03Props) {
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
        <div className="absolute inset-0 bg-foreground/40" />
      </div>
      <div className="relative mx-auto flex min-h-[24rem] max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:min-h-[28rem] sm:px-6 sm:py-32 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
            {description}
          </p>
        )}
        {ctaText && ctaHref && (
          <Button asChild size="lg" className="mt-8">
            <a href={ctaHref}>{ctaText}</a>
          </Button>
        )}
      </div>
    </section>
  )
}
