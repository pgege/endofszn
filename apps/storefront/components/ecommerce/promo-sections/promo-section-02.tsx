import { cn } from "@/lib/utils"
import type { EcommerceTestimonial } from "../types"

interface PromoSection02Props {
  imageSrc: string
  title?: string
  description?: string
  testimonials?: EcommerceTestimonial[]
  className?: string
}

export function PromoSection02({
  imageSrc,
  title,
  description,
  testimonials = [],
  className,
}: PromoSection02Props) {
  return (
    <section
      data-slot="promo-section"
      className={cn("relative overflow-hidden py-24 sm:py-32", className)}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          {title && (
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          )}
        </div>
        {testimonials.length > 0 && (
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <blockquote
                key={testimonial.id}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <p className="text-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
                <footer className="mt-4 text-sm text-muted-foreground">
                  — {testimonial.attribution}
                </footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
