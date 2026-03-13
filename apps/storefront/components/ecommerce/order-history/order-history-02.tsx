"use client"

import { cn } from "@/lib/utils"
import type { EcommerceOrder } from "../types"

interface OrderHistory02Props {
  title?: string
  orders: EcommerceOrder[]
  className?: string
}

export function OrderHistory02({
  title = "Order history",
  orders,
  className,
}: OrderHistory02Props) {
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
        <div className="mt-8 overflow-hidden rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-foreground"
                >
                  Order
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-foreground"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-foreground"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-sm font-semibold text-foreground"
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-foreground">
                    #{order.number}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground">
                    <time dateTime={order.datetime}>{order.date}</time>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-sm font-medium text-foreground">
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-foreground">
                    {order.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
