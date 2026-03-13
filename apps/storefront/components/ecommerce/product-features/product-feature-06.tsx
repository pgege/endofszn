"use client"

import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { EcommerceTab } from "../types"

interface ProductFeature06Props {
  title?: string
  subtitle?: string
  tabs: EcommerceTab[]
  className?: string
}

export function ProductFeature06({
  title,
  subtitle,
  tabs,
  className,
}: ProductFeature06Props) {
  return (
    <section
      data-slot="product-feature"
      className={cn("bg-background py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {subtitle && (
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {subtitle}
            </p>
          )}
          {title && (
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h2>
          )}
        </div>
        <Tabs defaultValue={tabs[0]?.name} className="mt-16">
          <TabsList className="mx-auto mb-8 flex w-fit">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.name} value={tab.name}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.name} value={tab.name}>
              <div className="rounded-lg border border-border bg-card p-8">
                {tab.content}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
