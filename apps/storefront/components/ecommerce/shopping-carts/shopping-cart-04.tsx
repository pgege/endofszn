"use client"

import { Trash2Icon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { EcommerceCartItem } from "../types"

interface ShoppingCart04Props {
  items: EcommerceCartItem[]
  subtotal?: string
  shippingEstimate?: string
  tax?: string
  total?: string
  onRemoveItem?: (item: EcommerceCartItem) => void
  onUpdateQuantity?: (item: EcommerceCartItem, quantity: number) => void
  onCheckout?: () => void
  className?: string
}

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export function ShoppingCart04({
  items,
  subtotal,
  shippingEstimate,
  tax,
  total,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  className,
}: ShoppingCart04Props) {
  return (
    <div
      data-slot="shopping-cart"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Shopping cart
        </h1>
        <div className="mt-8 lg:grid lg:grid-cols-2 lg:gap-x-12">
          <div className="lg:col-span-1">
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-6">
                  <Link
                    href={item.href}
                    className="size-24 shrink-0 overflow-hidden rounded-md bg-muted"
                  >
                    <img
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      className="size-full object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={item.href}
                      className="font-medium text-foreground hover:underline"
                    >
                      {item.name}
                    </Link>
                    {(item.color || item.size) && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[item.color, item.size].filter(Boolean).join(" / ")}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {item.price}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
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
          </div>
          <div className="mt-8 lg:col-span-1 lg:mt-0">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Order summary
              </h2>
              <div className="mt-4 space-y-2">
                {subtotal != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">
                      {subtotal}
                    </span>
                  </div>
                )}
                {shippingEstimate != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Shipping estimate
                    </span>
                    <span className="font-medium text-foreground">
                      {shippingEstimate}
                    </span>
                  </div>
                )}
                {tax != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax estimate</span>
                    <span className="font-medium text-foreground">{tax}</span>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              {total != null && (
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-foreground">Order total</span>
                  <span className="text-foreground">{total}</span>
                </div>
              )}
              <Button
                className="mt-6 w-full bg-primary text-primary-foreground"
                onClick={onCheckout}
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
