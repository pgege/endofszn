"use client"

import { Trash2Icon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { EcommerceCartItem } from "../types"

interface ShoppingCart01Props {
  items: EcommerceCartItem[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  subtotal?: string
  onRemoveItem?: (item: EcommerceCartItem) => void
  onUpdateQuantity?: (item: EcommerceCartItem, quantity: number) => void
  onCheckout?: () => void
  className?: string
}

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export function ShoppingCart01({
  items,
  open = false,
  onOpenChange,
  subtotal,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  className,
}: ShoppingCart01Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-slot="shopping-cart"
        className={cn("flex flex-col p-0", className)}
        side="right"
      >
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="text-foreground">Shopping cart</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 px-4">
          <ul className="divide-y divide-border py-4">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                <Link
                  href={item.href}
                  className="size-20 shrink-0 overflow-hidden rounded-md bg-muted"
                >
                  <img
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    className="size-full object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col gap-1">
                  <Link
                    href={item.href}
                    className="font-medium text-foreground hover:underline"
                  >
                    {item.name}
                  </Link>
                  {(item.color || item.size) && (
                    <p className="text-sm text-muted-foreground">
                      {[item.color, item.size].filter(Boolean).join(" / ")}
                    </p>
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {item.price}
                  </p>
                  <div className="mt-auto flex items-center gap-2">
                    <select
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateQuantity?.(item, Number(e.target.value))
                      }
                      className="h-8 w-14 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                    >
                      {QUANTITY_OPTIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemoveItem?.(item)}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <SheetFooter className="flex-col gap-2 border-t border-border px-4 py-4">
          {subtotal != null && (
            <div className="flex w-full justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{subtotal}</span>
            </div>
          )}
          <Button
            className="w-full bg-primary text-primary-foreground"
            onClick={onCheckout}
          >
            Checkout
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
