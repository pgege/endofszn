'use client'

import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

export function CartSummary() {
  return (
    <Button variant="outline" size="icon" className="relative">
      <ShoppingCart className="h-4 w-4" />
    </Button>
  )
}
