"use client"

import Link from "next/link"

import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { EcommerceOrder, EcommerceOrderItem } from "../types"

function getLineTotal(item: EcommerceOrderItem): string {
  const num = parseFloat(item.price.replace(/[^0-9.]/g, ""))
  if (Number.isNaN(num)) return item.price
  const total = (num * item.quantity).toFixed(2)
  return item.price.startsWith("$") ? `$${total}` : total
}

function getStatusProgress(status?: string): number {
  if (!status) return 0
  const normalized = status.toLowerCase()
  if (
    normalized.includes("delivered") ||
    normalized.includes("complete") ||
    normalized.includes("received")
  )
    return 100
  if (
    normalized.includes("transit") ||
    normalized.includes("shipping") ||
    normalized.includes("out for delivery")
  )
    return 75
  if (
    normalized.includes("shipped") ||
    normalized.includes("dispatched") ||
    normalized.includes("processing")
  )
    return 50
  if (
    normalized.includes("confirmed") ||
    normalized.includes("preparing") ||
    normalized.includes("pending")
  )
    return 25
  return 0
}

export interface OrderSummary03Props {
  order: EcommerceOrder
  className?: string
}

export function OrderSummary03({ order, className }: OrderSummary03Props) {
  return (
    <div
      data-slot="order-summary"
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            Order #{order.number}
          </h2>
          <p className="text-muted-foreground text-sm">
            Placed on <time dateTime={order.datetime}>{order.date}</time>
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {order.status}
        </span>
      </div>

      <Separator className="my-6" />

      <ul className="space-y-8">
        {order.items.map((item) => {
          const progress = getStatusProgress(item.status ?? order.status)
          return (
            <li key={item.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Link
                  href={item.href}
                  className="block shrink-0 overflow-hidden rounded-lg bg-muted sm:size-32"
                >
                  <img
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    className="aspect-square size-full object-cover sm:aspect-square sm:size-32"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    className="text-foreground text-base font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  {(item.color || item.size) && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {[item.color, item.size].filter(Boolean).join(" / ")}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-1 text-sm">
                    Qty {item.quantity} × {item.price}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.status ?? order.status}
                      </span>
                      <span className="text-foreground font-medium">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="mt-2 h-2" />
                  </div>
                  {item.deliveryDate && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      Est. delivery: {item.deliveryDate}
                    </p>
                  )}
                </div>
                <p className="text-foreground shrink-0 text-base font-semibold sm:self-start">
                  {getLineTotal(item)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <Separator className="my-6" />

      <div className="flex justify-between text-base font-semibold">
        <span className="text-foreground">Total</span>
        <span className="text-foreground">{order.total}</span>
      </div>

      {order.invoiceHref && (
        <Link
          href={order.invoiceHref}
          className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
        >
          View invoice
        </Link>
      )}
    </div>
  )
}
