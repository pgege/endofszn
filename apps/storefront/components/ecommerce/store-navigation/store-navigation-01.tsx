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

export interface StoreNavigation01Props {
  navigation: EcommerceNavigation
  logo?: ReactNode
  cartItemCount?: number
  onCartClick?: () => void
  onSearchClick?: () => void
  className?: string
}

function CategoryFlyout({
  category,
}: {
  category: EcommerceNavCategory
}) {
  return (
    <div className="flex w-[600px] gap-8 p-6">
      {category.featured.length > 0 && (
        <div className="flex flex-col gap-4">
          <span className="text-sm font-medium text-foreground">
            Featured
          </span>
          <div className="grid grid-cols-2 gap-4">
            {category.featured.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex flex-col gap-2"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                  <img
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary">
                  {item.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4">
        {category.sections.map((section) => (
          <div key={section.id}>
            <span className="text-sm font-medium text-foreground">
              {section.name}
            </span>
            <ul className="mt-2 space-y-1">
              {section.items.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StoreNavigation01({
  navigation,
  logo,
  cartItemCount = 0,
  onCartClick,
  onSearchClick,
  className,
}: StoreNavigation01Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      data-slot="store-navigation"
      className={cn(
        "border-b border-border bg-background",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
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
                      <ul className="mt-2 space-y-2">
                        {category.featured.map((item) => (
                          <li key={item.name}>
                            <a
                              href={item.href}
                              className="flex items-center gap-3"
                              onClick={() => setMobileOpen(false)}
                            >
                              <img
                                src={item.imageSrc}
                                alt={item.imageAlt}
                                className="size-12 rounded-md object-cover"
                              />
                              <span className="text-sm text-muted-foreground">
                                {item.name}
                              </span>
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

        {/* Logo */}
        <div className="flex items-center lg:flex-1">
          {logo ?? (
            <Link href="/" className="text-lg font-semibold text-foreground">
              Store
            </Link>
          )}
        </div>

        {/* Desktop nav */}
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
              <PopoverContent
                align="start"
                sideOffset={0}
                className="w-auto p-0"
              >
                <CategoryFlyout category={category} />
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

        {/* Actions */}
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
