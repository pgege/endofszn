'use client'

import Link from 'next/link'
import { StoreNavigation01 } from '@/components/ecommerce/store-navigation'
import type { EcommerceNavigation } from '@/components/ecommerce/types'

interface StoreHeaderClientProps {
  storeName: string
  navigation: EcommerceNavigation
}

export function StoreHeaderClient({ storeName, navigation }: StoreHeaderClientProps) {
  return (
    <StoreNavigation01
      navigation={navigation}
      logo={
        <Link href="/" className="text-xl font-bold">
          {storeName}
        </Link>
      }
    />
  )
}
