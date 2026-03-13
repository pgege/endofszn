"use client"

import { useState } from "react"
import { Truck, Shield, RefreshCw, CreditCard } from "lucide-react"

import {
  mockProductFull,
  mockProductOverview02,
  mockProducts,
  mockCategories,
  mockCartItems,
  mockReviews,
  mockRatingBreakdown,
  mockOrders,
  mockFilters,
  mockSortOptions,
  mockPromos,
  mockTestimonials,
  mockOffers,
  mockNavigation,
  mockFeatures,
  mockIncentives,
  mockImages,
  mockColors,
  mockSizes,
} from "./mock-data"

import { ProductOverview01 } from "@/components/ecommerce/product-overviews/product-overview-01"
import { ProductOverview02 } from "@/components/ecommerce/product-overviews/product-overview-02"
import { ProductOverview03 } from "@/components/ecommerce/product-overviews/product-overview-03"
import { ProductOverview04 } from "@/components/ecommerce/product-overviews/product-overview-04"
import { ProductOverview05 } from "@/components/ecommerce/product-overviews/product-overview-05"

import { ProductList01 } from "@/components/ecommerce/product-lists/product-list-01"
import { ProductList02 } from "@/components/ecommerce/product-lists/product-list-02"
import { ProductList03 } from "@/components/ecommerce/product-lists/product-list-03"
import { ProductList04 } from "@/components/ecommerce/product-lists/product-list-04"
import { ProductList05 } from "@/components/ecommerce/product-lists/product-list-05"
import { ProductList06 } from "@/components/ecommerce/product-lists/product-list-06"
import { ProductList07 } from "@/components/ecommerce/product-lists/product-list-07"
import { ProductList08 } from "@/components/ecommerce/product-lists/product-list-08"
import { ProductList09 } from "@/components/ecommerce/product-lists/product-list-09"
import { ProductList10 } from "@/components/ecommerce/product-lists/product-list-10"
import { ProductList11 } from "@/components/ecommerce/product-lists/product-list-11"

import { CategoryPreview01 } from "@/components/ecommerce/category-previews/category-preview-01"
import { CategoryPreview02 } from "@/components/ecommerce/category-previews/category-preview-02"
import { CategoryPreview03 } from "@/components/ecommerce/category-previews/category-preview-03"
import { CategoryPreview04 } from "@/components/ecommerce/category-previews/category-preview-04"
import { CategoryPreview05 } from "@/components/ecommerce/category-previews/category-preview-05"
import { CategoryPreview06 } from "@/components/ecommerce/category-previews/category-preview-06"

import { ShoppingCart01 } from "@/components/ecommerce/shopping-carts/shopping-cart-01"
import { ShoppingCart02 } from "@/components/ecommerce/shopping-carts/shopping-cart-02"
import { ShoppingCart03 } from "@/components/ecommerce/shopping-carts/shopping-cart-03"
import { ShoppingCart04 } from "@/components/ecommerce/shopping-carts/shopping-cart-04"
import { ShoppingCart05 } from "@/components/ecommerce/shopping-carts/shopping-cart-05"
import { ShoppingCart06 } from "@/components/ecommerce/shopping-carts/shopping-cart-06"

import { CategoryFilter01 } from "@/components/ecommerce/category-filters/category-filter-01"
import { CategoryFilter02 } from "@/components/ecommerce/category-filters/category-filter-02"
import { CategoryFilter03 } from "@/components/ecommerce/category-filters/category-filter-03"
import { CategoryFilter04 } from "@/components/ecommerce/category-filters/category-filter-04"
import { CategoryFilter05 } from "@/components/ecommerce/category-filters/category-filter-05"

import { ProductQuickview01 } from "@/components/ecommerce/product-quickviews/product-quickview-01"
import { ProductQuickview02 } from "@/components/ecommerce/product-quickviews/product-quickview-02"
import { ProductQuickview03 } from "@/components/ecommerce/product-quickviews/product-quickview-03"
import { ProductQuickview04 } from "@/components/ecommerce/product-quickviews/product-quickview-04"

import { ProductFeature01 } from "@/components/ecommerce/product-features/product-feature-01"
import { ProductFeature02 } from "@/components/ecommerce/product-features/product-feature-02"
import { ProductFeature03 } from "@/components/ecommerce/product-features/product-feature-03"
import { ProductFeature04 } from "@/components/ecommerce/product-features/product-feature-04"
import { ProductFeature05 } from "@/components/ecommerce/product-features/product-feature-05"
import { ProductFeature06 } from "@/components/ecommerce/product-features/product-feature-06"
import { ProductFeature07 } from "@/components/ecommerce/product-features/product-feature-07"
import { ProductFeature08 } from "@/components/ecommerce/product-features/product-feature-08"
import { ProductFeature09 } from "@/components/ecommerce/product-features/product-feature-09"

import { StoreNavigation01 } from "@/components/ecommerce/store-navigation/store-navigation-01"
import { StoreNavigation02 } from "@/components/ecommerce/store-navigation/store-navigation-02"
import { StoreNavigation03 } from "@/components/ecommerce/store-navigation/store-navigation-03"
import { StoreNavigation04 } from "@/components/ecommerce/store-navigation/store-navigation-04"
import { StoreNavigation05 } from "@/components/ecommerce/store-navigation/store-navigation-05"

import { PromoSection01 } from "@/components/ecommerce/promo-sections/promo-section-01"
import { PromoSection02 } from "@/components/ecommerce/promo-sections/promo-section-02"
import { PromoSection03 } from "@/components/ecommerce/promo-sections/promo-section-03"
import { PromoSection04 } from "@/components/ecommerce/promo-sections/promo-section-04"
import { PromoSection05 } from "@/components/ecommerce/promo-sections/promo-section-05"
import { PromoSection06 } from "@/components/ecommerce/promo-sections/promo-section-06"
import { PromoSection07 } from "@/components/ecommerce/promo-sections/promo-section-07"
import { PromoSection08 } from "@/components/ecommerce/promo-sections/promo-section-08"

import { CheckoutForm01 } from "@/components/ecommerce/checkout-forms/checkout-form-01"
import { CheckoutForm02 } from "@/components/ecommerce/checkout-forms/checkout-form-02"
import { CheckoutForm03 } from "@/components/ecommerce/checkout-forms/checkout-form-03"
import { CheckoutForm04 } from "@/components/ecommerce/checkout-forms/checkout-form-04"
import { CheckoutForm05 } from "@/components/ecommerce/checkout-forms/checkout-form-05"

import { Review01 } from "@/components/ecommerce/reviews/review-01"
import { Review02 } from "@/components/ecommerce/reviews/review-02"
import { Review03 } from "@/components/ecommerce/reviews/review-03"
import { Review04 } from "@/components/ecommerce/reviews/review-04"

import { OrderSummary01 } from "@/components/ecommerce/order-summaries/order-summary-01"
import { OrderSummary02 } from "@/components/ecommerce/order-summaries/order-summary-02"
import { OrderSummary03 } from "@/components/ecommerce/order-summaries/order-summary-03"
import { OrderSummary04 } from "@/components/ecommerce/order-summaries/order-summary-04"

import { OrderHistory01 } from "@/components/ecommerce/order-history/order-history-01"
import { OrderHistory02 } from "@/components/ecommerce/order-history/order-history-02"
import { OrderHistory03 } from "@/components/ecommerce/order-history/order-history-03"
import { OrderHistory04 } from "@/components/ecommerce/order-history/order-history-04"

import { Incentive01 } from "@/components/ecommerce/incentives/incentive-01"
import { Incentive02 } from "@/components/ecommerce/incentives/incentive-02"
import { Incentive03 } from "@/components/ecommerce/incentives/incentive-03"
import { Incentive04 } from "@/components/ecommerce/incentives/incentive-04"
import { Incentive05 } from "@/components/ecommerce/incentives/incentive-05"
import { Incentive06 } from "@/components/ecommerce/incentives/incentive-06"
import { Incentive07 } from "@/components/ecommerce/incentives/incentive-07"
import { Incentive08 } from "@/components/ecommerce/incentives/incentive-08"

import { Button } from "@/components/ui/button"

const sections = [
  "Product Overviews",
  "Product Lists",
  "Category Previews",
  "Shopping Carts",
  "Category Filters",
  "Product Quickviews",
  "Product Features",
  "Store Navigation",
  "Promo Sections",
  "Checkout Forms",
  "Reviews",
  "Order Summaries",
  "Order History",
  "Incentives",
]

function SectionHeading({ id, title, count }: { id: string; title: string; count: number }) {
  return (
    <div id={id} className="scroll-mt-20 border-b border-border bg-muted/50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{count} variants</p>
      </div>
    </div>
  )
}

function ComponentLabel({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
      <div className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
        {name}
      </div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-dashed border-border my-4" />
}

function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {mockProducts.slice(0, 4).map((p) => (
        <div key={p.id} className="rounded-lg border border-border p-4">
          <img src={p.imageSrc} alt={p.imageAlt} className="aspect-square w-full rounded-md object-cover" />
          <p className="mt-2 text-sm font-medium text-foreground">{p.name}</p>
          <p className="text-sm text-muted-foreground">{p.price}</p>
        </div>
      ))}
    </div>
  )
}

export default function EcommerceTestPage() {
  const [cart01Open, setCart01Open] = useState(false)
  const [cart05Open, setCart05Open] = useState(false)
  const [qv01Open, setQv01Open] = useState(false)
  const [qv02Open, setQv02Open] = useState(false)
  const [qv03Open, setQv03Open] = useState(false)
  const [qv04Open, setQv04Open] = useState(false)

  const policies = [
    { name: "Free delivery", icon: <Truck className="h-8 w-8" />, description: "Free shipping on orders over $100." },
    { name: "Secure checkout", icon: <Shield className="h-8 w-8" />, description: "256-bit SSL encryption." },
    { name: "Easy returns", icon: <RefreshCw className="h-8 w-8" />, description: "30-day return policy." },
    { name: "Flexible payment", icon: <CreditCard className="h-8 w-8" />, description: "Pay with any major card." },
  ]

  const mockTabs = [
    { name: "Description", content: <p>The Basic Tee is a timeless classic designed for everyday comfort. Made from 100% organic cotton with a relaxed fit that looks great on everyone.</p> },
    { name: "Features", content: <ul className="list-disc pl-5 space-y-1"><li>100% organic cotton</li><li>Pre-shrunk fabric</li><li>Machine washable</li><li>Imported</li></ul> },
    { name: "Reviews", content: <p>117 reviews, 4.0 average rating. Customers love the soft fabric and true-to-size fit.</p> },
  ]

  const featureImages = mockFeatures.map(f => ({ src: f.imageSrc!, alt: f.imageAlt! }))

  const incentivesWithIcons = mockIncentives.map((inc, i) => ({
    ...inc,
    icon: [<Truck key="t" className="h-8 w-8" />, <Shield key="s" className="h-8 w-8" />, <RefreshCw key="r" className="h-8 w-8" />, <CreditCard key="c" className="h-8 w-8" />][i % 4],
  }))

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <h1 className="text-lg font-semibold text-foreground">Ecommerce Component Test</h1>
          <span className="text-sm text-muted-foreground">84 components &middot; 14 categories</span>
        </div>
        <nav className="mx-auto max-w-7xl overflow-x-auto px-6 pb-3">
          <div className="flex gap-2">
            {sections.map((s) => (
              <a
                key={s}
                href={`#${s.toLowerCase().replace(/\s+/g, "-")}`}
                className="shrink-0 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                {s}
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* ===== 1. PRODUCT OVERVIEWS (5) ===== */}
      <SectionHeading id="product-overviews" title="Product Overviews" count={5} />

      <ComponentLabel name="01 — With tiered images" />
      <ProductOverview01 product={mockProductFull} policies={policies} />

      <Divider />
      <ComponentLabel name="02 — With image gallery and expandable details" />
      <ProductOverview02 product={mockProductOverview02} />

      <Divider />
      <ComponentLabel name="03 — Split with image" />
      <ProductOverview03
        product={{
          name: mockProductFull.name,
          price: mockProductFull.price,
          rating: mockProductFull.rating,
          reviewCount: mockProductFull.reviewCount,
          imageSrc: mockImages[0].src,
          imageAlt: mockImages[0].alt,
          description: mockProductFull.description,
          colors: mockColors,
          sizes: mockSizes,
        }}
      />

      <Divider />
      <ComponentLabel name="04 — With image grid" />
      <ProductOverview04 product={mockProductFull} />

      <Divider />
      <ComponentLabel name="05 — With tabs" />
      <ProductOverview05
        product={{
          name: mockProductFull.name,
          price: mockProductFull.price,
          rating: mockProductFull.rating,
          reviewCount: mockProductFull.reviewCount,
          imageSrc: mockImages[0].src,
          imageAlt: mockImages[0].alt,
          description: mockProductFull.description,
          colors: mockColors,
          sizes: mockSizes,
          tabs: mockTabs,
        }}
      />

      {/* ===== 2. PRODUCT LISTS (11) ===== */}
      <SectionHeading id="product-lists" title="Product Lists" count={11} />

      <ComponentLabel name="01 — With inline price" />
      <ProductList01 title="Customers also purchased" products={mockProducts} />

      <Divider />
      <ComponentLabel name="02 — With CTA link" />
      <ProductList02 title="Trending Products" products={mockProducts.slice(0, 4)} />

      <Divider />
      <ComponentLabel name="03 — With color swatches and horizontal scrolling" />
      <ProductList03 title="Popular Items" products={mockProducts} />

      <Divider />
      <ComponentLabel name="04 — With tall images" />
      <ProductList04 title="Just In" products={mockProducts.slice(0, 4)} />

      <Divider />
      <ComponentLabel name="05 — With image overlay and add button" />
      <ProductList05 title="Staff Picks" products={mockProducts.slice(0, 4)} />

      <Divider />
      <ComponentLabel name="06 — Simple" />
      <ProductList06 title="Simple Grid" products={mockProducts.slice(0, 8)} />

      <Divider />
      <ComponentLabel name="07 — With tall images and CTA link" />
      <ProductList07 title="Favorites" products={mockProducts.slice(0, 4)} />

      <Divider />
      <ComponentLabel name="08 — With border grid" />
      <ProductList08 title="All Products" products={mockProducts} />

      <Divider />
      <ComponentLabel name="09 — With supporting text" />
      <ProductList09 title="Featured" products={mockProducts.slice(0, 4)} />

      <Divider />
      <ComponentLabel name="10 — With inline price and CTA link" />
      <ProductList10 title="New Collection" products={mockProducts.slice(0, 4)} />

      <Divider />
      <ComponentLabel name="11 — Card with full details" />
      <ProductList11 title="Best Sellers" products={mockProducts.slice(0, 4)} />

      {/* ===== 3. CATEGORY PREVIEWS (6) ===== */}
      <SectionHeading id="category-previews" title="Category Previews" count={6} />

      <ComponentLabel name="01 — With image backgrounds" />
      <CategoryPreview01 title="Shop by Category" categories={mockCategories.slice(0, 3)} />

      <Divider />
      <ComponentLabel name="02 — Three-column" />
      <CategoryPreview02 categories={mockCategories.slice(0, 3)} />

      <Divider />
      <ComponentLabel name="03 — With background image and detail overlay" />
      <CategoryPreview03 categories={mockCategories.slice(0, 3)} />

      <Divider />
      <ComponentLabel name="04 — Three-column with description" />
      <CategoryPreview04 categories={mockCategories.slice(0, 3)} />

      <Divider />
      <ComponentLabel name="05 — With scrolling cards" />
      <CategoryPreview05 categories={mockCategories} />

      <Divider />
      <ComponentLabel name="06 — With split images" />
      <CategoryPreview06 categories={mockCategories.slice(0, 4)} />

      {/* ===== 4. SHOPPING CARTS (6) ===== */}
      <SectionHeading id="shopping-carts" title="Shopping Carts" count={6} />

      <ComponentLabel name="01 — Drawer" />
      <div className="mx-auto max-w-7xl px-6 py-4">
        <Button onClick={() => setCart01Open(true)}>Open Cart Drawer</Button>
        <ShoppingCart01
          items={mockCartItems}
          open={cart01Open}
          onOpenChange={setCart01Open}
          subtotal="$177.00"
        />
      </div>

      <Divider />
      <ComponentLabel name="02 — Two column with quantity dropdown" />
      <ShoppingCart02 items={mockCartItems} subtotal="$177.00" />

      <Divider />
      <ComponentLabel name="03 — Single column" />
      <ShoppingCart03 items={mockCartItems} subtotal="$177.00" />

      <Divider />
      <ComponentLabel name="04 — With extended summary" />
      <ShoppingCart04
        items={mockCartItems}
        subtotal="$177.00"
        shippingEstimate="$5.00"
        tax="$14.16"
        total="$196.16"
      />

      <Divider />
      <ComponentLabel name="05 — Dialog" />
      <div className="mx-auto max-w-7xl px-6 py-4">
        <Button onClick={() => setCart05Open(true)}>Open Cart Dialog</Button>
        <ShoppingCart05
          items={mockCartItems}
          open={cart05Open}
          onOpenChange={setCart05Open}
          subtotal="$177.00"
        />
      </div>

      <Divider />
      <ComponentLabel name="06 — Popover" />
      <div className="mx-auto max-w-7xl px-6 py-4">
        <ShoppingCart06 items={mockCartItems} subtotal="$177.00" />
      </div>

      {/* ===== 5. CATEGORY FILTERS (5) ===== */}
      <SectionHeading id="category-filters" title="Category Filters" count={5} />

      <ComponentLabel name="01 — With inline actions and expandable sidebar filters" />
      <CategoryFilter01 filters={mockFilters} sortOptions={mockSortOptions}>
        <PlaceholderGrid />
      </CategoryFilter01>

      <Divider />
      <ComponentLabel name="02 — With centered text and dropdown product filters" />
      <CategoryFilter02 filters={mockFilters} sortOptions={mockSortOptions}>
        <PlaceholderGrid />
      </CategoryFilter02>

      <Divider />
      <ComponentLabel name="03 — With dropdown product filters" />
      <CategoryFilter03 filters={mockFilters} sortOptions={mockSortOptions}>
        <PlaceholderGrid />
      </CategoryFilter03>

      <Divider />
      <ComponentLabel name="04 — With expandable product filter panel" />
      <CategoryFilter04 filters={mockFilters} sortOptions={mockSortOptions}>
        <PlaceholderGrid />
      </CategoryFilter04>

      <Divider />
      <ComponentLabel name="05 — Sidebar filters" />
      <CategoryFilter05 filters={mockFilters} sortOptions={mockSortOptions}>
        <PlaceholderGrid />
      </CategoryFilter05>

      {/* ===== 6. PRODUCT QUICKVIEWS (4) ===== */}
      <SectionHeading id="product-quickviews" title="Product Quickviews" count={4} />

      <ComponentLabel name="01 — With color and size selector" />
      <div className="mx-auto max-w-7xl px-6 py-4">
        <Button onClick={() => setQv01Open(true)}>Open Quickview 01</Button>
        <ProductQuickview01
          product={{
            name: mockProductFull.name,
            price: mockProductFull.price,
            imageSrc: mockImages[0].src,
            imageAlt: mockImages[0].alt,
            rating: mockProductFull.rating,
            reviewCount: mockProductFull.reviewCount,
            colors: mockColors,
            sizes: mockSizes,
          }}
          open={qv01Open}
          onOpenChange={setQv01Open}
        />
      </div>

      <Divider />
      <ComponentLabel name="02 — With color selector, size selector, and details link" />
      <div className="mx-auto max-w-7xl px-6 py-4">
        <Button onClick={() => setQv02Open(true)}>Open Quickview 02</Button>
        <ProductQuickview02
          product={{
            name: mockProductFull.name,
            price: mockProductFull.price,
            href: "#",
            imageSrc: mockImages[1].src,
            imageAlt: mockImages[1].alt,
            rating: mockProductFull.rating,
            reviewCount: mockProductFull.reviewCount,
            colors: mockColors,
            sizes: mockSizes,
          }}
          open={qv02Open}
          onOpenChange={setQv02Open}
        />
      </div>

      <Divider />
      <ComponentLabel name="03 — With large size selector" />
      <div className="mx-auto max-w-7xl px-6 py-4">
        <Button onClick={() => setQv03Open(true)}>Open Quickview 03</Button>
        <ProductQuickview03
          product={{
            name: mockProductFull.name,
            price: mockProductFull.price,
            imageSrc: mockImages[2].src,
            imageAlt: mockImages[2].alt,
            rating: mockProductFull.rating,
            reviewCount: mockProductFull.reviewCount,
            colors: mockColors,
            sizes: mockSizes,
          }}
          open={qv03Open}
          onOpenChange={setQv03Open}
        />
      </div>

      <Divider />
      <ComponentLabel name="04 — With color selector and description" />
      <div className="mx-auto max-w-7xl px-6 py-4">
        <Button onClick={() => setQv04Open(true)}>Open Quickview 04</Button>
        <ProductQuickview04
          product={{
            name: mockProductFull.name,
            price: mockProductFull.price,
            imageSrc: mockImages[3].src,
            imageAlt: mockImages[3].alt,
            description: mockProductFull.description,
            colors: mockColors,
          }}
          open={qv04Open}
          onOpenChange={setQv04Open}
        />
      </div>

      {/* ===== 7. PRODUCT FEATURES (9) ===== */}
      <SectionHeading id="product-features" title="Product Features" count={9} />

      <ComponentLabel name="01 — With image grid" />
      <ProductFeature01
        title="Technical Specifications"
        subtitle="Designed for comfort"
        description="Our products are built with the finest materials and attention to detail."
        images={featureImages}
      />

      <Divider />
      <ComponentLabel name="02 — With header, images, and descriptions" />
      <ProductFeature02
        title="What makes us different"
        subtitle="A better way to shop"
        features={mockFeatures}
      />

      <Divider />
      <ComponentLabel name="03 — With fading image" />
      <ProductFeature03
        title="Built for durability"
        subtitle="Premium materials"
        description="Every stitch, every seam, every detail has been considered and refined."
        imageSrc={mockFeatures[0].imageSrc}
        imageAlt={mockFeatures[0].imageAlt}
      />

      <Divider />
      <ComponentLabel name="04 — With wide images" />
      <ProductFeature04 title="Features" features={mockFeatures.slice(0, 2)} />

      <Divider />
      <ComponentLabel name="05 — With split image" />
      <ProductFeature05
        title="Craftsmanship"
        subtitle="Details matter"
        imageSrc={mockFeatures[1].imageSrc}
        imageAlt={mockFeatures[1].imageAlt}
        features={mockFeatures}
      />

      <Divider />
      <ComponentLabel name="06 — With tabs" />
      <ProductFeature06
        title="Product Details"
        subtitle="Everything you need to know"
        tabs={mockTabs}
      />

      <Divider />
      <ComponentLabel name="07 — With alternating sections" />
      <ProductFeature07
        title="Our Approach"
        subtitle="Quality first"
        features={mockFeatures.slice(0, 3)}
      />

      <Divider />
      <ComponentLabel name="08 — With square images" />
      <ProductFeature08
        title="Featured Materials"
        subtitle="Premium selection"
        features={mockFeatures}
      />

      <Divider />
      <ComponentLabel name="09 — With tiered images" />
      <ProductFeature09
        title="Design Philosophy"
        subtitle="Form meets function"
        description="We believe that great design should be both beautiful and functional."
        mainImage={{ src: mockFeatures[0].imageSrc!, alt: mockFeatures[0].imageAlt! }}
        sideImages={[
          { src: mockFeatures[1].imageSrc!, alt: mockFeatures[1].imageAlt! },
          { src: mockFeatures[2].imageSrc!, alt: mockFeatures[2].imageAlt! },
        ]}
        features={mockFeatures}
      />

      {/* ===== 8. STORE NAVIGATION (5) ===== */}
      <SectionHeading id="store-navigation" title="Store Navigation" count={5} />

      <ComponentLabel name="01 — With featured categories" />
      <div className="border border-border rounded-lg overflow-hidden my-4 mx-6">
        <StoreNavigation01 navigation={mockNavigation} />
      </div>

      <Divider />
      <ComponentLabel name="02 — With image grid" />
      <div className="border border-border rounded-lg overflow-hidden my-4 mx-6">
        <StoreNavigation02 navigation={mockNavigation} />
      </div>

      <Divider />
      <ComponentLabel name="03 — With simple menu and promo" />
      <div className="border border-border rounded-lg overflow-hidden my-4 mx-6">
        <StoreNavigation03 navigation={mockNavigation} />
      </div>

      <Divider />
      <ComponentLabel name="04 — With centered logo and featured categories" />
      <div className="border border-border rounded-lg overflow-hidden my-4 mx-6">
        <StoreNavigation04 navigation={mockNavigation} />
      </div>

      <Divider />
      <ComponentLabel name="05 — With double column and persistent mobile nav" />
      <div className="border border-border rounded-lg overflow-hidden my-4 mx-6">
        <StoreNavigation05 navigation={mockNavigation} />
      </div>

      {/* ===== 9. PROMO SECTIONS (8) ===== */}
      <SectionHeading id="promo-sections" title="Promo Sections" count={8} />

      <ComponentLabel name="01 — With image tiles" />
      <PromoSection01 title="Featured" subtitle="Check out our latest collections" promos={mockPromos} />

      <Divider />
      <ComponentLabel name="02 — With fading background image and testimonials" />
      <PromoSection02
        imageSrc={mockPromos[0].imageSrc}
        title="Find your perfect style"
        description="Discover curated collections for every occasion."
        testimonials={mockTestimonials}
      />

      <Divider />
      <ComponentLabel name="03 — Full-width with background image" />
      <PromoSection03
        imageSrc={mockPromos[1].imageSrc}
        title="New Season Arrivals"
        description="Discover the latest trends with our new collection."
        ctaText="Shop Collection"
      />

      <Divider />
      <ComponentLabel name="04 — Full-width with overlapping image tiles" />
      <PromoSection04 title="Shop the Look" subtitle="Curated picks for you" promos={mockPromos} />

      <Divider />
      <ComponentLabel name="05 — With background image" />
      <PromoSection05
        imageSrc={mockPromos[2].imageSrc}
        title="Mid-Season Sale"
        description="Save up to 40% on selected items."
        ctaText="Shop Sale"
      />

      <Divider />
      <ComponentLabel name="06 — With overlapping image tiles" />
      <PromoSection06 title="Trending Now" subtitle="Popular picks" promos={mockPromos} />

      <Divider />
      <ComponentLabel name="07 — With offers and split image" />
      <PromoSection07
        offers={mockOffers}
        imageSrc={mockPromos[0].imageSrc}
        title="Current Offers"
      />

      <Divider />
      <ComponentLabel name="08 — Full-width with background image and large content" />
      <PromoSection08
        imageSrc={mockPromos[1].imageSrc}
        title="The Summer Edit"
        description="Our curated selection of summer essentials, from lightweight tees to versatile accessories."
        ctaText="Explore Now"
      />

      {/* ===== 10. CHECKOUT FORMS (5) ===== */}
      <SectionHeading id="checkout-forms" title="Checkout Forms" count={5} />

      <ComponentLabel name="01 — Single step with order summary" />
      <CheckoutForm01
        items={mockCartItems}
        subtotal="$177.00"
        shipping="$5.00"
        tax="$14.16"
        total="$196.16"
      />

      <Divider />
      <ComponentLabel name="02 — With mobile order summary overlay" />
      <CheckoutForm02
        items={mockCartItems}
        subtotal="$177.00"
        shipping="$5.00"
        tax="$14.16"
        total="$196.16"
      />

      <Divider />
      <ComponentLabel name="03 — Multi-step" />
      <CheckoutForm03
        items={mockCartItems}
        currentStep={1}
        subtotal="$177.00"
        shipping="$5.00"
        tax="$14.16"
        total="$196.16"
      />

      <Divider />
      <ComponentLabel name="04 — With order summary sidebar" />
      <CheckoutForm04
        items={mockCartItems}
        subtotal="$177.00"
        shipping="$5.00"
        tax="$14.16"
        total="$196.16"
      />

      <Divider />
      <ComponentLabel name="05 — Split with order summary" />
      <CheckoutForm05
        items={mockCartItems}
        subtotal="$177.00"
        shipping="$5.00"
        tax="$14.16"
        total="$196.16"
      />

      {/* ===== 11. REVIEWS (4) ===== */}
      <SectionHeading id="reviews" title="Reviews" count={4} />

      <ComponentLabel name="01 — Multi-column" />
      <Review01 title="Customer Reviews" averageRating={4} totalCount={117} reviews={mockReviews} />

      <Divider />
      <ComponentLabel name="02 — With summary chart" />
      <Review02
        title="Customer Reviews"
        averageRating={4}
        totalCount={100}
        breakdown={mockRatingBreakdown}
        reviews={mockReviews}
      />

      <Divider />
      <ComponentLabel name="03 — Avatars with separate description" />
      <Review03 title="Recent Reviews" reviews={mockReviews} />

      <Divider />
      <ComponentLabel name="04 — Simple with avatars" />
      <Review04 title="What customers say" reviews={mockReviews} />

      {/* ===== 12. ORDER SUMMARIES (4) ===== */}
      <SectionHeading id="order-summaries" title="Order Summaries" count={4} />

      <ComponentLabel name="01 — With split image" />
      <OrderSummary01
        order={mockOrders[0]}
        heroImageSrc={mockPromos[0].imageSrc}
        heroImageAlt="Order confirmation"
      />

      <Divider />
      <ComponentLabel name="02 — With progress bars" />
      <OrderSummary02 order={mockOrders[0]} />

      <Divider />
      <ComponentLabel name="03 — With large images and progress bars" />
      <OrderSummary03 order={mockOrders[0]} />

      <Divider />
      <ComponentLabel name="04 — Simple with full order details" />
      <OrderSummary04 order={mockOrders[0]} />

      {/* ===== 13. ORDER HISTORY (4) ===== */}
      <SectionHeading id="order-history" title="Order History" count={4} />

      <ComponentLabel name="01 — Invoice panels" />
      <OrderHistory01 orders={mockOrders} />

      <Divider />
      <ComponentLabel name="02 — Invoice table" />
      <OrderHistory02 orders={mockOrders} />

      <Divider />
      <ComponentLabel name="03 — Invoice list" />
      <OrderHistory03 orders={mockOrders} />

      <Divider />
      <ComponentLabel name="04 — Invoice list with quick actions" />
      <OrderHistory04 orders={mockOrders} />

      {/* ===== 14. INCENTIVES (8) ===== */}
      <SectionHeading id="incentives" title="Incentives" count={8} />

      <ComponentLabel name="01 — 3-column with illustrations and split header" />
      <Incentive01
        title="We built our business on great customer service"
        description="At the beginning at least."
        incentives={mockIncentives.slice(0, 3)}
      />

      <Divider />
      <ComponentLabel name="02 — 4-column with illustrations" />
      <Incentive02 incentives={mockIncentives} />

      <Divider />
      <ComponentLabel name="03 — 3-column with illustrations and header" />
      <Incentive03 title="Why shop with us" incentives={mockIncentives.slice(0, 3)} />

      <Divider />
      <ComponentLabel name="04 — 3-column with illustrations and centered text" />
      <Incentive04 incentives={mockIncentives.slice(0, 3)} />

      <Divider />
      <ComponentLabel name="05 — 3-column with illustrations and heading" />
      <Incentive05 title="Our Promises" incentives={mockIncentives.slice(0, 3)} />

      <Divider />
      <ComponentLabel name="06 — 2x2 grid with illustrations" />
      <Incentive06 incentives={mockIncentives} />

      <Divider />
      <ComponentLabel name="07 — 3-column with icons and supporting text" />
      <Incentive07 incentives={incentivesWithIcons.slice(0, 3)} />

      <Divider />
      <ComponentLabel name="08 — 3-column with icons" />
      <Incentive08 incentives={incentivesWithIcons.slice(0, 3)} />

      <footer className="border-t border-border bg-muted/50 py-12 text-center text-sm text-muted-foreground">
        End of ecommerce component test — 84 components, 14 categories
      </footer>
    </div>
  )
}
