"use client"

import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { EcommerceOrder } from "../types"

interface OrderHistory01Props {
  title?: string
  orders: EcommerceOrder[]
  className?: string
}

export function OrderHistory01({
  title = "Order history",
  orders,
  className,
}: OrderHistory01Props) {
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
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Order #{order.number}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <time dateTime={order.datetime}>{order.date}</time>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-sm font-medium text-foreground">
                    {order.status}
                  </span>
                  <p className="text-lg font-semibold text-foreground">
                    {order.total}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <ul className="divide-y divide-border">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                    <Link
                      href={item.href}
                      className="size-16 shrink-0 overflow-hidden rounded-md bg-muted"
                    >
                      <img
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        className="size-full object-cover"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col justify-center">
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
                      <p className="text-sm text-muted-foreground">
                        Qty {item.quantity} · {item.price}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
