"use client"

import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { EcommerceAddress, EcommerceOrder, EcommerceOrderItem } from "../types"

function getLineTotal(item: EcommerceOrderItem): string {
  const num = parseFloat(item.price.replace(/[^0-9.]/g, ""))
  if (Number.isNaN(num)) return item.price
  const total = (num * item.quantity).toFixed(2)
  return item.price.startsWith("$") ? `$${total}` : total
}

function formatAddress(address: EcommerceAddress) {
  return [
    address.name,
    address.street,
    [address.city, address.state, address.zip].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ]
    .filter(Boolean)
    .join("\n")
}

export interface OrderSummary04Props {
  order: EcommerceOrder
  className?: string
}

export function OrderSummary04({ order, className }: OrderSummary04Props) {
  return (
    <div
      data-slot="order-summary"
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            Order #{order.number}
          </h2>
          <p className="text-muted-foreground text-sm">
            Placed on <time dateTime={order.datetime}>{order.date}</time>
          </p>
          <span className="text-muted-foreground mt-2 inline-block rounded-full bg-muted px-3 py-1 text-sm font-medium">
            {order.status}
          </span>
        </div>

        <Separator />

        <div>
          <h3 className="text-foreground text-sm font-medium">Items</h3>
          <ul className="mt-3 space-y-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4">
                <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
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
                  {(item.color || item.size) && (
                    <p className="text-muted-foreground text-sm">
                      {[item.color, item.size].filter(Boolean).join(" / ")}
                    </p>
                  )}
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

        {order.billingAddress && (
          <>
            <Separator />
            <div>
              <h3 className="text-foreground text-sm font-medium">
                Billing address
              </h3>
              <p className="text-muted-foreground mt-2 whitespace-pre-line text-sm">
                {formatAddress(order.billingAddress)}
              </p>
            </div>
          </>
        )}

        {order.paymentMethod && (
          <>
            <Separator />
            <div>
              <h3 className="text-foreground text-sm font-medium">
                Payment method
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {order.paymentMethod}
              </p>
            </div>
          </>
        )}

        {order.shippingMethod && (
          <>
            <Separator />
            <div>
              <h3 className="text-foreground text-sm font-medium">
                Shipping method
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {order.shippingMethod}
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
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{order.total}</span>
          </div>
        </div>

        {order.invoiceHref && (
          <Link
            href={order.invoiceHref}
            className="text-primary inline-block text-sm font-medium hover:underline"
          >
            View invoice
          </Link>
        )}
      </div>
    </div>
  )
}
