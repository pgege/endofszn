import { cn } from "@/lib/utils"
import type { EcommerceCategory } from "../types"

interface CategoryPreview01Props {
  title?: string
  categories: EcommerceCategory[]
  className?: string
}

export function CategoryPreview01({
  title,
  categories,
  className,
}: CategoryPreview01Props) {
  return (
    <div
      data-slot="category-preview"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {title && (
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <a
              key={category.id}
              href={category.href}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg"
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
  )
}
