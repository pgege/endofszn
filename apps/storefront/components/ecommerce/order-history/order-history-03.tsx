"use client"

import { cn } from "@/lib/utils"
import type { EcommerceOrder } from "../types"

interface OrderHistory03Props {
  title?: string
  orders: EcommerceOrder[]
  className?: string
}

export function OrderHistory03({
  title = "Order history",
  orders,
  className,
}: OrderHistory03Props) {
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
            <li key={order.id} className="py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Order #{order.number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <time dateTime={order.datetime}>{order.date}</time>
                    {" · "}
                    {order.status}
                  </p>
                </div>
                <p className="text-sm font-medium text-foreground sm:text-right">
                  {order.total}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
