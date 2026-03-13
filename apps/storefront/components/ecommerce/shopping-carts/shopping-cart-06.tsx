"use client"

import { ShoppingBag, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { EcommerceCartItem } from "../types"

interface ShoppingCart06Props {
  items: EcommerceCartItem[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  subtotal?: string
  onRemoveItem?: (itemId: string) => void
  onCheckout?: () => void
  trigger?: React.ReactNode
  className?: string
}

export function ShoppingCart06({
  items,
  open,
  onOpenChange,
  subtotal,
  onRemoveItem,
  onCheckout,
  trigger,
  className,
}: ShoppingCart06Props) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingBag className="h-6 w-6" />
            {items.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {items.length}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        data-slot="shopping-cart"
        className={cn("w-80 p-0", className)}
        align="end"
      >
        <div className="p-4">
          <h3 className="text-lg font-medium text-foreground">Shopping Cart</h3>
        </div>

        {items.length === 0 ? (
          <div className="px-4 pb-6 text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="max-h-60 overflow-y-auto px-4">
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex py-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border">
                      <img
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-3 flex flex-1 flex-col">
                      <div className="flex justify-between text-sm font-medium text-foreground">
                        <h4>
                          <a href={item.href}>{item.name}</a>
                        </h4>
                        <p className="ml-2">{item.price}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Qty {item.quantity}
                      </p>
                      <button
                        type="button"
                        onClick={() => onRemoveItem?.(item.id)}
                        className="mt-1 self-start text-xs font-medium text-primary hover:text-primary/80"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border p-4">
              {subtotal && (
                <div className="flex justify-between text-sm font-medium text-foreground">
                  <span>Subtotal</span>
                  <span>{subtotal}</span>
                </div>
              )}
              <Button onClick={onCheckout} className="mt-4 w-full" size="sm">
                Checkout
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                or{" "}
                <button
                  type="button"
                  onClick={() => onOpenChange?.(false)}
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Continue Shopping
                </button>
              </p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
