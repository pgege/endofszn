"use client"

import * as React from "react"
import { ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import type { EcommerceCartItem } from "../types"

export interface CheckoutForm02Props {
  items: EcommerceCartItem[]
  subtotal?: string
  shipping?: string
  tax?: string
  total?: string
  onSubmit?: (e: React.FormEvent) => void
  className?: string
}

function OrderSummaryContent({
  items,
  subtotal = "$99.00",
  shipping = "$5.00",
  tax = "$8.32",
  total = "$112.32",
}: {
  items: EcommerceCartItem[]
  subtotal?: string
  shipping?: string
  tax?: string
  total?: string
}) {
  return (
    <>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
              <img
                src={item.imageSrc}
                alt={item.imageAlt}
                className="size-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">
                {item.name}
              </p>
              <p className="text-muted-foreground text-sm">
                Qty {item.quantity} × {item.price}
              </p>
            </div>
            <p className="text-foreground shrink-0 text-sm font-medium">
              ${(Number(item.price.replace(/[^0-9.]/g, "")) * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-foreground">{shipping}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span className="text-foreground">{tax}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between text-base font-medium">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{total}</span>
        </div>
      </div>
    </>
  )
}

export function CheckoutForm02({
  items,
  subtotal = "$99.00",
  shipping = "$5.00",
  tax = "$8.32",
  total = "$112.32",
  onSubmit,
  className,
}: CheckoutForm02Props) {
  return (
    <div
      data-slot="checkout-form"
      className={cn("w-full", className)}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.(e)
        }}
        className="grid gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div className="space-y-8">
          <div>
            <h2 className="text-foreground text-lg font-medium">
              Contact information
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-foreground text-lg font-medium">
              Shipping address
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main St" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="San Francisco" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select>
                  <SelectTrigger id="state" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ca">California</SelectItem>
                    <SelectItem value="ny">New York</SelectItem>
                    <SelectItem value="tx">Texas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP code</Label>
                <Input id="zip" placeholder="94102" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select>
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-foreground text-lg font-medium">
              Payment method
            </h2>
            <RadioGroup defaultValue="card" className="mt-4 space-y-3">
              <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  Credit card
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                  PayPal
                </Label>
              </div>
            </RadioGroup>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="card-number">Card number</Label>
                <Input id="card-number" placeholder="4242 4242 4242 4242" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry</Label>
                <Input id="expiry" placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:pt-0">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-foreground text-lg font-medium">
              Order summary
            </h3>
            <div className="mt-4">
              <OrderSummaryContent
                items={items}
                subtotal={subtotal}
                shipping={shipping}
                tax={tax}
                total={total}
              />
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full">
            Complete order
          </Button>
        </div>

        <div className="lg:hidden">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="w-full" type="button">
                <ShoppingBag className="size-4" />
                View order summary ({items.length} items)
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Order summary</DrawerTitle>
              </DrawerHeader>
              <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">
                <OrderSummaryContent
                  items={items}
                  subtotal={subtotal}
                  shipping={shipping}
                  tax={tax}
                  total={total}
                />
              </div>
            </DrawerContent>
          </Drawer>
          <Button type="submit" className="mt-6 w-full">
            Complete order
          </Button>
        </div>
      </form>
    </div>
  )
}
