"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type {
  EcommerceActiveFilter,
  EcommerceFilter,
  EcommerceFilterOption,
  EcommerceSortOption,
} from "../types"

export interface CategoryFilter03Props {
  filters: EcommerceFilter[]
  sortOptions?: EcommerceSortOption[]
  activeFilters?: EcommerceActiveFilter[]
  onFilterChange?: (filterId: string, option: EcommerceFilterOption) => void
  onRemoveFilter?: (value: string) => void
  onClearAll?: () => void
  children?: React.ReactNode
  className?: string
}

export function CategoryFilter03({
  filters,
  sortOptions,
  activeFilters = [],
  onFilterChange,
  onRemoveFilter,
  onClearAll,
  children,
  className,
}: CategoryFilter03Props) {
  return (
    <div data-slot="category-filter" className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <DropdownMenu key={filter.id}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {filter.name}
                  <ChevronDown className="ml-2 size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>{filter.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filter.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={option.checked}
                    onCheckedChange={(checked) =>
                      onFilterChange?.(filter.id, {
                        ...option,
                        checked: checked === true,
                      })
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {sortOptions && sortOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Sort
                  <ChevronDown className="ml-2 size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortOptions.map((option) => (
                  <DropdownMenuItem key={option.name} asChild>
                    <a
                      href={option.href}
                      className={cn(
                        option.current && "bg-accent text-accent-foreground"
                      )}
                    >
                      {option.name}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.value}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground"
            >
              {filter.label}
              {onRemoveFilter && (
                <button
                  type="button"
                  className="ml-1 rounded hover:bg-accent"
                  onClick={() => onRemoveFilter(filter.value)}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {onClearAll && (
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </div>
      )}

      <div>{children}</div>
    </div>
  )
}
