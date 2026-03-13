import { getProducts } from '@/features/products/api/get-products'
import { getCollections } from '@/features/collections/api/get-collections'
import { getStore } from '@/features/store/api/get-store'
import { mapProduct, mapCollection } from '@/lib/mappers'
import { ProductList01 } from '@/components/ecommerce/product-lists'
import { CategoryPreview01 } from '@/components/ecommerce/category-previews'
import { Incentive01 } from '@/components/ecommerce/incentives'
import { Truck, RefreshCw, ShieldCheck, Headphones } from 'lucide-react'
import Link from 'next/link'

export default async function Home() {
  const [storeResult, productsResult, collectionsResult] = await Promise.allSettled([
    getStore(),
    getProducts({ limit: 8 }),
    getCollections({ limit: 6 }),
  ])

  const storeName =
    storeResult.status === 'fulfilled' ? storeResult.value.store.name : 'Store'
  const products =
    productsResult.status === 'fulfilled' ? productsResult.value.products : []
  const collections =
    collectionsResult.status === 'fulfilled' ? collectionsResult.value.collections : []

  const mappedProducts = products.map(mapProduct)
  const mappedCollections = collections.map(mapCollection)

  const incentives = [
    {
      name: 'Free Shipping',
      description: 'Free shipping on orders over $50',
      icon: <Truck className="h-8 w-8" />,
    },
    {
      name: 'Easy Returns',
      description: '30-day hassle-free returns',
      icon: <RefreshCw className="h-8 w-8" />,
    },
    {
      name: 'Secure Checkout',
      description: 'Your data is always protected',
      icon: <ShieldCheck className="h-8 w-8" />,
    },
    {
      name: '24/7 Support',
      description: 'We are here to help anytime',
      icon: <Headphones className="h-8 w-8" />,
    },
  ]

  return (
    <main>
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {storeName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Discover our curated selection of products
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Shop All
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              Browse Collections
            </Link>
          </div>
        </div>
      </section>

      {mappedProducts.length > 0 && (
        <ProductList01 title="Featured Products" products={mappedProducts} />
      )}

      {mappedCollections.length > 0 && (
        <CategoryPreview01 title="Collections" categories={mappedCollections} />
      )}

      <Incentive01 incentives={incentives} />
    </main>
  )
}
