import { cn } from "@/lib/utils"
import type { EcommerceCategory } from "../types"

interface CategoryPreview04Props {
  categories: EcommerceCategory[]
  className?: string
}

export function CategoryPreview04({
  categories,
  className,
}: CategoryPreview04Props) {
  return (
    <div
      data-slot="category-preview"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <a
              key={category.id}
              href={category.href}
              className="group"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img
                  src={category.imageSrc}
                  alt={category.imageAlt}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
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
