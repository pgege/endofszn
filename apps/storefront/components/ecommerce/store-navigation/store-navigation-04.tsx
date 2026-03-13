"use client"

import { useState } from "react"
import { Menu, X, ShoppingBag, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { EcommerceNavigation } from "../types"

export interface StoreNavigation04Props {
  navigation: EcommerceNavigation
  logo?: React.ReactNode
  cartItemCount?: number
  onCartClick?: () => void
  onSearchClick?: () => void
  className?: string
}

export function StoreNavigation04({
  navigation,
  logo,
  cartItemCount,
  onCartClick,
  onSearchClick,
  className,
}: StoreNavigation04Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const halfIdx = Math.ceil(navigation.categories.length / 2)
  const leftCategories = navigation.categories.slice(0, halfIdx)
  const rightCategories = navigation.categories.slice(halfIdx)

  return (
    <nav
      data-slot="store-navigation"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-x-6">
            {leftCategories.map((category) => (
              <Popover key={category.id}>
                <PopoverTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {category.name}
                </PopoverTrigger>
                <PopoverContent className="w-screen max-w-md p-6" align="start">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    {category.featured.map((item) => (
                      <div key={item.name} className="group relative">
                        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                          <img
                            src={item.imageSrc}
                            alt={item.imageAlt}
                            className="h-full w-full object-cover group-hover:opacity-75"
                          />
                        </div>
                        <a
                          href={item.href}
                          className="mt-2 block text-sm font-medium text-foreground"
                        >
                          <span className="absolute inset-0" />
                          {item.name}
                        </a>
                      </div>
                    ))}
                  </div>
                  {category.sections.length > 0 && (
                    <div className="mt-6 border-t border-border pt-6">
                      {category.sections.map((section) => (
                        <div key={section.id} className="mt-4 first:mt-0">
                          <p className="text-sm font-medium text-foreground">
                            {section.name}
                          </p>
                          <ul className="mt-2 space-y-2">
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
                  )}
                </PopoverContent>
              </Popover>
            ))}
          </div>

          <div className="flex lg:flex-1 lg:justify-center">
            {logo ?? (
              <a href="/" className="text-xl font-bold text-foreground">
                Store
              </a>
            )}
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-x-6">
            {rightCategories.map((category) => (
              <Popover key={category.id}>
                <PopoverTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {category.name}
                </PopoverTrigger>
                <PopoverContent className="w-screen max-w-md p-6" align="end">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    {category.featured.map((item) => (
                      <div key={item.name} className="group relative">
                        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                          <img
                            src={item.imageSrc}
                            alt={item.imageAlt}
                            className="h-full w-full object-cover group-hover:opacity-75"
                          />
                        </div>
                        <a
                          href={item.href}
                          className="mt-2 block text-sm font-medium text-foreground"
                        >
                          <span className="absolute inset-0" />
                          {item.name}
                        </a>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ))}

            {navigation.pages.map((page) => (
              <a
                key={page.name}
                href={page.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {page.name}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4 lg:hidden">
            <Button variant="ghost" size="icon" onClick={onSearchClick}>
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount !== undefined && cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          <div className="hidden items-center gap-4 lg:flex lg:ml-4">
            <Button variant="ghost" size="icon" onClick={onSearchClick}>
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount !== undefined && cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="h-full max-h-screen w-full max-w-sm p-0 sm:max-w-sm [&>button]:hidden">
          <div className="flex h-full flex-col overflow-y-auto bg-background">
            <div className="flex items-center justify-between px-4 py-4">
              {logo ?? (
                <span className="text-xl font-bold text-foreground">Store</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-6 px-4 py-6">
              {navigation.categories.map((category) => (
                <div key={category.id}>
                  <p className="text-sm font-medium text-foreground">{category.name}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {category.featured.map((item) => (
                      <div key={item.name} className="group relative">
                        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                          <img
                            src={item.imageSrc}
                            alt={item.imageAlt}
                            className="h-full w-full object-cover group-hover:opacity-75"
                          />
                        </div>
                        <a
                          href={item.href}
                          className="mt-2 block text-sm text-foreground"
                        >
                          {item.name}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {navigation.pages.map((page) => (
                <a
                  key={page.name}
                  href={page.href}
                  className="block text-base font-medium text-foreground"
                >
                  {page.name}
                </a>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  )
}
