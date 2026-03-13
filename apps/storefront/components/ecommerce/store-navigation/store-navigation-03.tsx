"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import type {
  EcommerceNavigation,
  EcommerceNavCategory,
} from "../types"

export interface StoreNavigation03Props {
  navigation: EcommerceNavigation
  logo?: ReactNode
  promoBanner?: ReactNode
  cartItemCount?: number
  onCartClick?: () => void
  onSearchClick?: () => void
  className?: string
}

function SimpleCategoryMenu({
  category,
}: {
  category: EcommerceNavCategory
}) {
  return (
    <div className="w-56 p-2">
      {category.featured.length > 0 && (
        <div className="mb-3 border-b border-border pb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Featured
          </span>
          <ul className="mt-2 space-y-1">
            {category.featured.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className="block rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent"
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {category.sections.map((section) => (
        <div key={section.id} className="mb-3 last:mb-0">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section.name}
          </span>
          <ul className="mt-2 space-y-1">
            {section.items.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className="block rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent"
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function StoreNavigation03({
  navigation,
  logo,
  promoBanner,
  cartItemCount = 0,
  onCartClick,
  onSearchClick,
  className,
}: StoreNavigation03Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      data-slot="store-navigation"
      className={cn(
        "border-b border-border bg-background",
        className
      )}
    >
      {promoBanner && (
        <div className="bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
          {promoBanner}
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:hidden">
          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent
              showCloseButton={false}
              className="max-w-[calc(100%-2rem)] p-0 sm:max-w-md"
            >
              <div className="flex flex-col divide-y divide-border">
                <div className="flex items-center justify-between p-4">
                  {logo}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="size-5" />
                  </Button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-4">
                  {navigation.categories.map((category) => (
                    <div key={category.id} className="py-4">
                      <span className="text-sm font-medium text-foreground">
                        {category.name}
                      </span>
                      <ul className="mt-2 space-y-1">
                        {category.featured.map((item) => (
                          <li key={item.name}>
                            <a
                              href={item.href}
                              className="text-sm text-muted-foreground"
                              onClick={() => setMobileOpen(false)}
                            >
                              {item.name}
                            </a>
                          </li>
                        ))}
                        {category.sections.flatMap((s) =>
                          s.items.map((item) => (
                            <li key={`${s.id}-${item.name}`}>
                              <a
                                href={item.href}
                                className="text-sm text-muted-foreground"
                                onClick={() => setMobileOpen(false)}
                              >
                                {item.name}
                              </a>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ))}
                  {navigation.pages.map((page) => (
                    <a
                      key={page.name}
                      href={page.href}
                      className="block py-2 text-sm text-muted-foreground"
                      onClick={() => setMobileOpen(false)}
                    >
                      {page.name}
                    </a>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center lg:flex-1">
          {logo ?? (
            <Link href="/" className="text-lg font-semibold text-foreground">
              Store
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          {navigation.categories.map((category) => (
            <Popover key={category.id}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-foreground hover:bg-accent hover:text-foreground"
                >
                  {category.name}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={4}>
                <SimpleCategoryMenu category={category} />
              </PopoverContent>
            </Popover>
          ))}
          {navigation.pages.map((page) => (
            <a
              key={page.name}
              href={page.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {page.name}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchClick}
            aria-label="Search"
          >
            <Search className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCartClick}
            aria-label="Cart"
            className="relative"
          >
            <ShoppingBag className="size-5" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </nav>
  )
}
