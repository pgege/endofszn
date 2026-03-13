"use client"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { EcommerceFilter, EcommerceSortOption } from "../types"

export interface CategoryFilter05Props {
  filters: EcommerceFilter[]
  sortOptions?: EcommerceSortOption[]
  onFilterChange?: (filterId: string, value: string, checked: boolean) => void
  children?: React.ReactNode
  className?: string
}

export function CategoryFilter05({
  filters,
  sortOptions,
  onFilterChange,
  children,
  className,
}: CategoryFilter05Props) {
  return (
    <div data-slot="category-filter" className={cn("bg-background", className)}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between border-b border-border pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Products
          </h1>
          {sortOptions && sortOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
              <div className="flex gap-4">
                {sortOptions.map((option) => (
                  <a
                    key={option.name}
                    href={option.href}
                    className={cn(
                      "text-sm",
                      option.current
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-12 lg:grid lg:grid-cols-4 lg:gap-x-8">
          <aside className="lg:col-span-1">
            <h2 className="sr-only">Filters</h2>
            <div className="space-y-10">
              {filters.map((filter) => (
                <div key={filter.id}>
                  <h3 className="text-sm font-medium text-foreground">{filter.name}</h3>
                  <div className="mt-4 space-y-3">
                    {filter.options.map((option) => (
                      <div key={option.value} className="flex items-center gap-3">
                        <Checkbox
                          id={`filter-${filter.id}-${option.value}`}
                          checked={option.checked}
                          onCheckedChange={(checked) =>
                            onFilterChange?.(filter.id, option.value, !!checked)
                          }
                        />
                        <Label
                          htmlFor={`filter-${filter.id}-${option.value}`}
                          className="text-sm text-muted-foreground"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="mt-6 lg:col-span-3 lg:mt-0">{children}</div>
        </div>
      </div>
    </div>
  )
}
