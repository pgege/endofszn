import { cn } from "@/lib/utils"
import type { EcommerceCategory } from "../types"

interface CategoryPreview05Props {
  categories: EcommerceCategory[]
  className?: string
}

export function CategoryPreview05({
  categories,
  className,
}: CategoryPreview05Props) {
  return (
    <div
      data-slot="category-preview"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex gap-4">
            {categories.map((category) => (
              <a
                key={category.id}
                href={category.href}
                className="group flex min-w-[280px] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-muted"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={category.imageSrc}
                    alt={category.imageAlt}
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <h3 className="font-semibold text-foreground">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
