import { cn } from "@/lib/utils"
import type { EcommerceCategory } from "../types"

interface CategoryPreview02Props {
  categories: EcommerceCategory[]
  className?: string
}

export function CategoryPreview02({
  categories,
  className,
}: CategoryPreview02Props) {
  const [primary, ...secondary] = categories

  return (
    <div
      data-slot="category-preview"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {primary && (
            <a
              href={primary.href}
              className="group relative aspect-[4/5] overflow-hidden rounded-lg lg:aspect-auto lg:row-span-2"
            >
              <img
                src={primary.imageSrc}
                alt={primary.imageAlt}
                className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                <h3 className="text-2xl font-semibold text-primary-foreground drop-shadow-sm">
                  {primary.name}
                </h3>
              </div>
            </a>
          )}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {secondary.slice(0, 2).map((category) => (
              <a
                key={category.id}
                href={category.href}
                className="group relative aspect-[21/9] overflow-hidden rounded-lg"
              >
                <img
                  src={category.imageSrc}
                  alt={category.imageAlt}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                  <h3 className="text-xl font-semibold text-primary-foreground drop-shadow-sm">
                    {category.name}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
