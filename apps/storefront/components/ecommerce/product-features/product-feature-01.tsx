import { cn } from "@/lib/utils"

interface ProductFeature01Props {
  title?: string
  subtitle?: string
  description?: string
  images: { src: string; alt: string }[]
  className?: string
}

export function ProductFeature01({
  title,
  subtitle,
  description,
  images,
  className,
}: ProductFeature01Props) {
  return (
    <section
      data-slot="product-feature"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
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
              <p className="mt-6 text-base text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {images.map((image, idx) => (
              <div
                key={idx}
                className={cn(
                  "overflow-hidden rounded-lg bg-muted",
                  idx === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"
                )}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
