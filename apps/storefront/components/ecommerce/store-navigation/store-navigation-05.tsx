"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Search, Home } from "lucide-react"
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

export interface StoreNavigation05Props {
  navigation: EcommerceNavigation
  logo?: ReactNode
  cartItemCount?: number
  onCartClick?: () => void
  onSearchClick?: () => void
  className?: string
}

function DoubleColumnFlyout({
  category,
}: {
  category: EcommerceNavCategory
}) {
  const mid = Math.ceil(category.sections.length / 2)
  const leftSections = category.sections.slice(0, mid)
  const rightSections = category.sections.slice(mid)

  return (
    <div className="flex w-[500px] gap-0 p-0">
      <div className="flex w-1/2 flex-col border-r border-border">
        {category.featured.length > 0 && (
          <div className="border-b border-border p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Featured
            </span>
            <ul className="mt-2 space-y-2">
              {category.featured.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-accent"
                  >
                    <img
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      className="size-10 shrink-0 rounded-md object-cover"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex-1 p-4">
          {leftSections.map((section) => (
            <div key={section.id} className="mb-4 last:mb-0">
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
      </div>
      <div className="flex w-1/2 flex-col p-4">
        {rightSections.map((section) => (
          <div key={section.id} className="mb-4 last:mb-0">
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
    </div>
  )
}

export function StoreNavigation05({
  navigation,
  logo,
  cartItemCount = 0,
  onCartClick,
  onSearchClick,
  className,
}: StoreNavigation05Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <nav
        data-slot="store-navigation"
        className={cn(
          "border-b border-border bg-background",
          className
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="lg:hidden">
              <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
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
                        onClick={() => setMobileMenuOpen(false)}
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
                                  onClick={() => setMobileMenuOpen(false)}
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
                                    onClick={() => setMobileMenuOpen(false)}
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
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {page.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="hidden lg:flex lg:items-center">
              <div className="flex items-center">
                {logo ?? (
                  <Link
                    href="/"
                    className="text-lg font-semibold text-foreground"
                  >
                    Store
                  </Link>
                )}
              </div>
              <div className="ml-8 flex items-center gap-1">
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
                      <DoubleColumnFlyout category={category} />
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
            </div>
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

      <div
        data-slot="store-navigation-mobile"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background lg:hidden"
      >
        <div className="flex h-16 items-center justify-around">
          <a
            href="/"
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            <Home className="size-5" />
            <span className="text-xs">Home</span>
          </a>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="size-5" />
            <span className="text-xs">Menu</span>
          </button>
          <button
            type="button"
            onClick={onSearchClick}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            <Search className="size-5" />
            <span className="text-xs">Search</span>
          </button>
          <button
            type="button"
            onClick={onCartClick}
            className="relative flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            <ShoppingBag className="size-5" />
            <span className="text-xs">Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute right-2 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
