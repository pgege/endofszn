"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import type {
  EcommerceActiveFilter,
  EcommerceFilter,
  EcommerceFilterOption,
  EcommerceSortOption,
} from "../types"

export interface CategoryFilter01Props {
  filters: EcommerceFilter[]
  sortOptions?: EcommerceSortOption[]
  activeFilters?: EcommerceActiveFilter[]
  onFilterChange?: (filterId: string, option: EcommerceFilterOption) => void
  onRemoveFilter?: (value: string) => void
  onClearAll?: () => void
  children?: React.ReactNode
  className?: string
}

export function CategoryFilter01({
  filters,
  sortOptions,
  activeFilters = [],
  onFilterChange,
  onRemoveFilter,
  onClearAll,
  children,
  className,
}: CategoryFilter01Props) {
  return (
    <div
      data-slot="category-filter"
      className={cn("flex gap-8", className)}
    >
      <aside className="w-64 shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Filters</h3>
          {activeFilters.length > 0 && onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={onClearAll}
            >
              Clear all
            </Button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
          </div>
        )}

        <nav className="space-y-2">
          {filters.map((filter) => (
            <Collapsible key={filter.id} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-medium text-foreground hover:bg-accent">
                {filter.name}
                <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 pl-2">
                  {filter.options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`${filter.id}-${option.value}`}
                        checked={option.checked}
                        onCheckedChange={(checked) =>
                          onFilterChange?.(filter.id, {
                            ...option,
                            checked: checked === true,
                          })
                        }
                      />
                      <Label
                        htmlFor={`${filter.id}-${option.value}`}
                        className="cursor-pointer text-sm font-normal text-foreground"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        {sortOptions && sortOptions.length > 0 && (
          <div className="mb-4 flex justify-end">
            <div className="flex gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.name}
                  variant={option.current ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <a href={option.href}>{option.name}</a>
                </Button>
              ))}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
