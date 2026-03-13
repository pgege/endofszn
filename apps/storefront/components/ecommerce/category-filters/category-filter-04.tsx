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

export interface CategoryFilter04Props {
  filters: EcommerceFilter[]
  sortOptions?: EcommerceSortOption[]
  activeFilters?: EcommerceActiveFilter[]
  onFilterChange?: (filterId: string, option: EcommerceFilterOption) => void
  onRemoveFilter?: (value: string) => void
  onClearAll?: () => void
  children?: React.ReactNode
  className?: string
  title?: string
}

export function CategoryFilter04({
  filters,
  sortOptions,
  activeFilters = [],
  onFilterChange,
  onRemoveFilter,
  onClearAll,
  children,
  className,
  title = "Products",
}: CategoryFilter04Props) {
  return (
    <div data-slot="category-filter" className={cn("space-y-6", className)}>
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {sortOptions && sortOptions.length > 0 && (
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
        )}
      </header>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            Filters
            <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((filter) => (
                    <span
                      key={filter.value}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
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
            </div>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filters.map((filter) => (
                <div key={filter.id} className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">
                    {filter.name}
                  </h3>
                  <div className="space-y-2">
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
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div>{children}</div>
    </div>
  )
}
