import { useState, useMemo } from 'react'
import { Loader2, ImageIcon, Search, X, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Category, useBulkCategorize } from '@/lib/api/categories'
import { useStoreId } from '../../store-context'

type UncategorizedProduct = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  categories?: Array<{ id: string; name: string; parent_category?: { id: string; name: string } | null }>
}

interface BulkCategorizeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: UncategorizedProduct[]
  categories: Category[]
}

export function BulkCategorizeModal({
  open,
  onOpenChange,
  products,
  categories,
}: BulkCategorizeModalProps) {
  const storeId = useStoreId()
  const [productSearch, setProductSearch] = useState('')
  const [assignments, setAssignments] = useState<Map<string, string[]>>(new Map())
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const bulkCategorize = useBulkCategorize(storeId)

  const leafCategories = useMemo(() => {
    return categories.filter(cat => {
      const children = cat.category_children || []
      return children.length === 0
    })
  }, [categories])

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products
    const search = productSearch.toLowerCase()
    return products.filter(p => p.title.toLowerCase().includes(search))
  }, [products, productSearch])

  const getCategoryPath = (category: Category | { id: string; name: string; parent_category?: { id: string; name: string } | null }): string => {
    if (category.parent_category) {
      return `${category.parent_category.name} > ${category.name}`
    }
    return category.name
  }

  const getProductCategories = (product: UncategorizedProduct): Array<{ id: string; name: string; parent_category?: { id: string; name: string } | null }> => {
    const assignedIds = assignments.get(product.id) || []
    const existingCategories = product.categories || []
    const assignedCategories = assignedIds.map(id => {
      const cat = categories.find(c => c.id === id)
      return cat ? { id: cat.id, name: cat.name, parent_category: cat.parent_category } : null
    }).filter(Boolean) as Array<{ id: string; name: string; parent_category?: { id: string; name: string } | null }>
    
    const allCategories = [...existingCategories]
    assignedCategories.forEach(ac => {
      if (!allCategories.find(c => c.id === ac.id)) {
        allCategories.push(ac)
      }
    })
    return allCategories
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const selectAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const toggleExpanded = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const assignCategoryToSelected = () => {
    if (selectedProducts.size === 0 || !selectedCategory) {
      toast.error('Select products and a category')
      return
    }

    setAssignments(prev => {
      const next = new Map(prev)
      selectedProducts.forEach(productId => {
        const existing = next.get(productId) || []
        if (!existing.includes(selectedCategory)) {
          next.set(productId, [...existing, selectedCategory])
        }
      })
      return next
    })

    toast.success(`Assigned category to ${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''}`)
    setSelectedCategory('')
  }

  const removeCategoryFromProduct = (productId: string, categoryId: string) => {
    setAssignments(prev => {
      const next = new Map(prev)
      const existing = next.get(productId) || []
      const filtered = existing.filter(id => id !== categoryId)
      if (filtered.length === 0) {
        next.delete(productId)
      } else {
        next.set(productId, filtered)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (assignments.size === 0) {
      toast.error('No category assignments to save')
      return
    }

    try {
      const assignmentsList = Array.from(assignments.entries()).map(([productId, categoryIds]) => ({
        product_id: productId,
        category_ids: categoryIds,
      }))

      await bulkCategorize.mutateAsync({ assignments: assignmentsList })
      toast.success(`Updated categories for ${assignments.size} product${assignments.size > 1 ? 's' : ''}`)
      handleClose()
    } catch (err: any) {
      toast.error('Failed to save categories', { description: err.message })
    }
  }

  const handleClose = () => {
    setAssignments(new Map())
    setProductSearch('')
    setSelectedCategory('')
    setSelectedProducts(new Set())
    setExpandedProducts(new Set())
    onOpenChange(false)
  }

  const pendingChanges = assignments.size

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw]! w-[90vw]! h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Tag className="h-5 w-5" />
            Bulk Assign Categories
            {pendingChanges > 0 && (
              <Badge variant="secondary">{pendingChanges} pending</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Select products and assign them to categories. Only leaf categories can be assigned.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-6 py-4 border-b bg-muted/30 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                  onCheckedChange={selectAllProducts}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {selectedProducts.size} of {filteredProducts.length} selected
                </span>
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-md space-y-1.5">
                <Label className="text-sm">Assign category to selected products</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leafCategories.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        No leaf categories available
                      </div>
                    ) : (
                      leafCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {getCategoryPath(category)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={assignCategoryToSelected}
                disabled={selectedProducts.size === 0 || !selectedCategory}
              >
                Assign
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="divide-y">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.has(product.id)
                const hasChanges = assignments.has(product.id)
                const productCategories = getProductCategories(product)
                const isExpanded = expandedProducts.has(product.id)
                const hasCategories = productCategories.length > 0
                const displayedCategories = isExpanded ? productCategories : productCategories.slice(0, 3)
                const hiddenCount = productCategories.length - 3

                return (
                  <div
                    key={product.id}
                    className={cn(
                      'flex gap-4 px-6 py-4 transition-colors',
                      isSelected && 'bg-primary/5',
                      hasChanges && !isSelected && 'bg-amber-500/5'
                    )}
                  >
                    <div className="flex items-start gap-3 shrink-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        className="mt-1"
                      />
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{product.handle}</p>
                        </div>
                        {hasChanges && (
                          <Badge variant="secondary" className="shrink-0 text-xs">Modified</Badge>
                        )}
                      </div>

                      {hasCategories && (
                        <div className="mt-2">
                          <div className="flex items-center flex-wrap gap-1.5">
                            {displayedCategories.map(cat => {
                              const isAssigned = assignments.get(product.id)?.includes(cat.id)
                              return (
                                <Badge
                                  key={cat.id}
                                  variant={isAssigned ? 'default' : 'outline'}
                                  className="gap-1 pr-1"
                                >
                                  <span className="max-w-[150px] truncate text-xs">
                                    {getCategoryPath(cat)}
                                  </span>
                                  {isAssigned && (
                                    <button
                                      type="button"
                                      onClick={() => removeCategoryFromProduct(product.id, cat.id)}
                                      className="ml-0.5 rounded-full p-0.5 hover:bg-background/20"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </Badge>
                              )
                            })}
                            {!isExpanded && hiddenCount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => toggleExpanded(product.id)}
                              >
                                +{hiddenCount} more
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                            {isExpanded && productCategories.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => toggleExpanded(product.id)}
                              >
                                Show less
                                <ChevronUp className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {filteredProducts.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  {productSearch ? 'No products match your search' : 'No uncategorized products'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {products.length} product{products.length !== 1 ? 's' : ''} • {leafCategories.length} leaf categories available
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={pendingChanges === 0 || bulkCategorize.isPending}
              >
                {bulkCategorize.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save {pendingChanges > 0 ? `(${pendingChanges} product${pendingChanges > 1 ? 's' : ''})` : ''}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
