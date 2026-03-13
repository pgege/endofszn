import { cn } from "@/lib/utils"
import type { EcommerceCategory } from "../types"

interface CategoryPreview03Props {
  categories: EcommerceCategory[]
  className?: string
}

export function CategoryPreview03({
  categories,
  className,
}: CategoryPreview03Props) {
  return (
    <div
      data-slot="category-preview"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
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
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity group-hover:from-black/90">
                <h3 className="text-lg font-semibold text-primary-foreground">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-primary-foreground/90">
                    {category.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
