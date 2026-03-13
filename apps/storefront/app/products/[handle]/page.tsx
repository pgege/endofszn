import { getProductByHandle } from '@/features/products/api/get-products'
import { ProductDetailClient } from '@/features/products/components/product-detail-client'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ handle: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { handle } = await params

  let product
  try {
    const result = await getProductByHandle(handle)
    product = result.product
  } catch {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <ProductDetailClient product={product} />
    </main>
  )
}
