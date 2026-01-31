import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Package, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useProducts, useDeleteProduct, Product } from '@/lib/api/products'
import { useStore } from '@/lib/api/auth'
import { paths } from '@/config/paths'
import { useState } from 'react'

function ProductCard({ product, storeId, onDelete }: { product: Product; storeId: string; onDelete: () => void }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <Card className="overflow-hidden">
        <div className="aspect-square relative bg-muted">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={paths.app.stores.products.detail.getHref(storeId, product.id)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                to={paths.app.stores.products.detail.getHref(storeId, product.id)}
                className="font-medium hover:underline line-clamp-1"
              >
                {product.title}
              </Link>
              {product.variants && product.variants.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
              {product.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{product.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function ProductListPage() {
  const { id: storeId } = useParams<{ id: string }>()
  const { data: store, isLoading: storeLoading, error: storeError } = useStore(storeId!)
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts(storeId!)
  const deleteProduct = useDeleteProduct(storeId!)

  const isLoading = storeLoading || productsLoading
  const error = storeError || productsError

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {storeError ? 'Store not found' : 'Failed to load products'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'Something went wrong'}
          </p>
          <Button asChild>
            <Link to={paths.app.root.getHref()}>Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={paths.app.stores.detail.getHref(storeId!)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-muted-foreground">{store.name}</p>
          </div>
        </div>
        <Button asChild>
          <Link to={paths.app.stores.products.new.getHref(storeId!)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first product to start selling
            </p>
            <Button asChild>
              <Link to={paths.app.stores.products.new.getHref(storeId!)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              storeId={storeId!}
              onDelete={() => deleteProduct.mutate(product.id)}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
