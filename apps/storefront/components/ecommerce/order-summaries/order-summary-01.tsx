"use client"

import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { EcommerceAddress, EcommerceOrder, EcommerceOrderItem } from "../types"

function formatAddress(address: EcommerceAddress) {
  return [
    address.name,
    address.street,
    [address.city, address.state, address.zip].filter(Boolean).join(", "),
    address.country,
  ]
    .filter(Boolean)
    .join("\n")
}

function getLineTotal(item: EcommerceOrderItem): string {
  const num = parseFloat(item.price.replace(/[^0-9.]/g, ""))
  if (Number.isNaN(num)) return item.price
  const total = (num * item.quantity).toFixed(2)
  return item.price.startsWith("$") ? `$${total}` : total
}

export interface OrderSummary01Props {
  order: EcommerceOrder
  heroImageSrc?: string
  heroImageAlt?: string
  className?: string
}

export function OrderSummary01({
  order,
  heroImageSrc,
  heroImageAlt = "Order confirmation",
  className,
}: OrderSummary01Props) {
  return (
    <div
      data-slot="order-summary"
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
    >
      <div className="grid lg:grid-cols-2">
        {heroImageSrc && (
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[400px]">
            <img
              src={heroImageSrc}
              alt={heroImageAlt}
              className="size-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-col p-6 lg:p-8">
          <div className="flex flex-1 flex-col gap-6">
            <div>
              <p className="text-muted-foreground text-sm">
                Order #{order.number}
              </p>
              <h2 className="text-foreground mt-1 text-2xl font-semibold">
                Thank you for your order
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Your order was placed on{" "}
                <time dateTime={order.datetime}>{order.date}</time>
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 px-4 py-3">
              <p className="text-foreground text-sm font-medium">
                Order status: {order.status}
              </p>
              {order.deliveryDate && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Estimated delivery: {order.deliveryDate}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-foreground text-sm font-medium">
                Order details
              </h3>
              <ul className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={item.href}
                        className="text-foreground text-sm font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        Qty {item.quantity} × {item.price}
                      </p>
                    </div>
                    <p className="text-foreground shrink-0 text-sm font-medium">
                      {getLineTotal(item)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {order.shippingAddress && (
              <>
                <Separator />
                <div>
                  <h3 className="text-foreground text-sm font-medium">
                    Shipping address
                  </h3>
                  <p className="text-muted-foreground mt-2 whitespace-pre-line text-sm">
                    {formatAddress(order.shippingAddress)}
                  </p>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2 text-sm">
              {order.subtotal != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{order.subtotal}</span>
                </div>
              )}
              {order.shippingPrice != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground">{order.shippingPrice}</span>
                </div>
              )}
              {order.tax != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-foreground">{order.tax}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-medium">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{order.total}</span>
              </div>
            </div>
          </div>

          {order.invoiceHref && (
            <div className="mt-6 pt-6">
              <Link
                href={order.invoiceHref}
                className="text-primary text-sm font-medium hover:underline"
              >
                View invoice
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
