"use client"

import { FileTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EcommerceOrder } from "../types"

interface OrderHistory04Props {
  title?: string
  orders: EcommerceOrder[]
  onViewOrder?: (order: EcommerceOrder) => void
  onViewInvoice?: (order: EcommerceOrder) => void
  className?: string
}

export function OrderHistory04({
  title = "Order history",
  orders,
  onViewOrder,
  onViewInvoice,
  className,
}: OrderHistory04Props) {
  return (
    <div
      data-slot="order-history"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {title && (
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
        )}
        <ul className="mt-8 divide-y divide-border">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Order #{order.number}
                </p>
                <p className="text-sm text-muted-foreground">
                  <time dateTime={order.datetime}>{order.date}</time>
                  {" · "}
                  {order.status}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {order.total}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {onViewOrder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewOrder(order)}
                  >
                    View order
                  </Button>
                )}
                {onViewInvoice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewInvoice(order)}
                  >
                    <FileTextIcon className="size-4" />
                    View invoice
                  </Button>
                )}
                {!onViewInvoice && order.invoiceHref && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={order.invoiceHref}>
                      <FileTextIcon className="size-4" />
                      View invoice
                    </a>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
