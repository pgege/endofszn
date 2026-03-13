import { getStore } from '@/features/store/api/get-store'
import { getCategories } from '@/features/categories/api/get-categories'
import { getCollections } from '@/features/collections/api/get-collections'
import { StoreHeaderClient } from './store-header-client'
import type { CategoryTreeNode } from '@/lib/storefront'

function flattenTree(nodes: CategoryTreeNode[]): { name: string; handle: string }[] {
  const result: { name: string; handle: string }[] = []
  for (const node of nodes) {
    for (const child of node.children) {
      result.push({ name: child.name, handle: child.handle })
    }
  }
  return result
}

export async function StoreHeader() {
  const [storeResult, categoriesResult, collectionsResult] = await Promise.allSettled([
    getStore(),
    getCategories(),
    getCollections({ limit: 10 }),
  ])

  const store =
    storeResult.status === 'fulfilled' ? storeResult.value.store : null
  const storeName = store?.name || 'Store'
  const tree =
    categoriesResult.status === 'fulfilled'
      ? categoriesResult.value.tree
      : []
  const collections =
    collectionsResult.status === 'fulfilled'
      ? collectionsResult.value.collections
      : []

  const categories = flattenTree(tree)

  const pages = [
    { name: 'Products', href: '/products' },
    { name: 'Collections', href: '/collections' },
  ]

  const navCategories = collections.length > 0
    ? [
        {
          id: 'collections',
          name: 'Shop',
          featured: collections.slice(0, 4).map((c) => ({
            name: c.title,
            href: `/collections/${c.handle}`,
            imageSrc: c.imageSrc || '',
            imageAlt: c.title,
          })),
          sections: categories.length > 0
            ? [
                {
                  id: 'categories',
                  name: 'Categories',
                  items: categories.map((cat) => ({
                    name: cat.name,
                    href: `/categories/${cat.handle}`,
                  })),
                },
              ]
            : [],
        },
      ]
    : []

  return (
    <StoreHeaderClient
      storeName={storeName}
      navigation={{ categories: navCategories, pages }}
    />
  )
}
