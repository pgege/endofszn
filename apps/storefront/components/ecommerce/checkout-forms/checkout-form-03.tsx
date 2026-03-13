"use client"

import * as React from "react"
import { Check } from "lucide-react"
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
import type { EcommerceCartItem } from "../types"

export interface CheckoutStep {
  name: string
  status: "complete" | "current" | "upcoming"
}

export interface CheckoutForm03Props {
  items: EcommerceCartItem[]
  currentStep?: number
  steps?: CheckoutStep[]
  subtotal?: string
  shipping?: string
  tax?: string
  total?: string
  onSubmit?: (e: React.FormEvent) => void
  onStepChange?: (step: number) => void
  className?: string
}

const STEP_NAMES = ["Contact", "Shipping", "Payment"]

function getStepsFromCurrentStep(current: number): CheckoutStep[] {
  return STEP_NAMES.map((name, i) => ({
    name,
    status:
      current > i ? "complete" : current === i ? "current" : "upcoming",
  }))
}

function OrderSummary({
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
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-foreground text-lg font-medium">Order summary</h3>
      <div className="mt-4 space-y-4">
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
    </div>
  )
}

export function CheckoutForm03({
  items,
  currentStep = 1,
  steps: stepsProp,
  subtotal = "$99.00",
  shipping = "$5.00",
  tax = "$8.32",
  total = "$112.32",
  onSubmit,
  onStepChange,
  className,
}: CheckoutForm03Props) {
  const steps = stepsProp ?? getStepsFromCurrentStep(currentStep)

  return (
    <div
      data-slot="checkout-form"
      className={cn("w-full", className)}
    >
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, index) => (
              <li
                key={step.name}
                className={cn(
                  "relative",
                  index !== steps.length - 1 && "flex-1 pr-8 sm:pr-20"
                )}
              >
                <button
                  type="button"
                  onClick={() => onStepChange?.(index)}
                  className="flex items-center"
                  aria-current={step.status === "current" ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      step.status === "complete" &&
                        "border-primary bg-primary text-primary-foreground",
                      step.status === "current" &&
                        "border-primary bg-background text-foreground",
                      step.status === "upcoming" &&
                        "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {step.status === "complete" ? (
                      <Check className="size-5" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "ml-2 text-sm font-medium",
                      step.status === "current"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </span>
                </button>
                {index !== steps.length - 1 && (
                  <div
                    className="absolute top-5 left-4 -ml-px h-0.5 w-full sm:left-10"
                    aria-hidden="true"
                  >
                    <div
                      className={cn(
                        "h-full",
                        step.status === "complete" ? "bg-primary" : "bg-border"
                      )}
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.(e)
        }}
        className="grid gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div className="space-y-8">
          {currentStep === 0 && (
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
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
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
          )}

          {currentStep === 2 && (
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
          )}

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onStepChange?.(currentStep - 1)}
              >
                Back
              </Button>
            )}
            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={() => onStepChange?.(currentStep + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button type="submit">Complete order</Button>
            )}
          </div>
        </div>

        <div className="lg:pt-0">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={total}
          />
        </div>
      </form>
    </div>
  )
}
