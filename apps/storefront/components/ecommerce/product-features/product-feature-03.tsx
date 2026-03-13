import { cn } from "@/lib/utils"

interface ProductFeature03Props {
  title?: string
  subtitle?: string
  description?: string
  imageSrc?: string
  imageAlt?: string
  className?: string
}

export function ProductFeature03({
  title,
  subtitle,
  description,
  imageSrc,
  imageAlt,
  className,
}: ProductFeature03Props) {
  return (
    <section
      data-slot="product-feature"
      className={cn("relative overflow-hidden bg-background py-24 sm:py-32", className)}
    >
      {imageSrc && (
        <div className="absolute inset-0">
          <img
            src={imageSrc}
            alt={imageAlt ?? ""}
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"
            aria-hidden
          />
        </div>
      )}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
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
            <p className="mt-6 text-base text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </section>
  )
}
