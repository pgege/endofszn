import { getCollections } from '@/features/collections/api/get-collections'
import { mapCollection } from '@/lib/mappers'
import { CategoryPreview01 } from '@/components/ecommerce/category-previews'

export default async function CollectionsPage() {
  const { collections } = await getCollections({ limit: 24 })
  const mapped = collections.map(mapCollection)

  return (
    <main className="container mx-auto px-4 py-8">
      <CategoryPreview01 title="Collections" categories={mapped} />
    </main>
  )
}
