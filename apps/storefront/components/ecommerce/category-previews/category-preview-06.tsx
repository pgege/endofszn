import { cn } from "@/lib/utils"
import type { EcommerceCategory } from "../types"

interface CategoryPreview06Props {
  categories: EcommerceCategory[]
  className?: string
}

export function CategoryPreview06({
  categories,
  className,
}: CategoryPreview06Props) {
  return (
    <div
      data-slot="category-preview"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="space-y-16">
          {categories.map((category, index) => (
            <a
              key={category.id}
              href={category.href}
              className={cn(
                "group grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12",
                index % 2 === 1 && "lg:grid-flow-dense"
              )}
            >
              <div
                className={cn(
                  "aspect-[16/10] overflow-hidden rounded-lg bg-muted",
                  index % 2 === 1 && "lg:col-start-2"
                )}
              >
                <img
                  src={category.imageSrc}
                  alt={category.imageAlt}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                />
              </div>
              <div
                className={cn(
                  "flex flex-col justify-center",
                  index % 2 === 1 && "lg:col-start-1 lg:row-start-1"
                )}
              >
                <h3 className="text-2xl font-semibold text-foreground">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-2 text-muted-foreground">
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
