import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, Trash2, Package, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  useProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUploadFiles,
  UpdateProductInput,
} from '@/lib/api/products'
import { api } from '@/lib/api-client'
import { useStore } from '@/lib/api/auth'
import { paths } from '@/config/paths'
import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  OptionInput,
  VariantInput,
  CustomerPreview,
  FullPagePreview,
  BasicsSection,
  ImagesSection,
  PricingSection,
} from '../components/product-form'

type Tab = 'basics' | 'images' | 'variants' | 'options' | 'preview'

const TABS: { id: Tab; title: string; description: string }[] = [
  { id: 'basics', title: 'Basics', description: 'Name & description' },
  { id: 'images', title: 'Images', description: 'Product photos' },
  { id: 'variants', title: 'Pricing', description: 'Variant prices' },
  { id: 'options', title: 'Options', description: 'Size, color, etc.' },
  { id: 'preview', title: 'Preview', description: 'Customer view' },
]

export default function ProductDetailPage() {
  const { id: storeId, productId } = useParams<{ id: string; productId: string }>()
  const navigate = useNavigate()
  const { data: store, isLoading: storeLoading } = useStore(storeId!)
  const { data: product, isLoading: productLoading } = useProduct(storeId!, productId!)
  const updateProduct = useUpdateProduct(storeId!, productId!)
  const deleteProduct = useDeleteProduct(storeId!)
  const uploadFiles = useUploadFiles()

  const [currentTab, setCurrentTab] = useState<Tab>('basics')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [imageLibrary, setImageLibrary] = useState<string[]>([])
  const [variants, setVariants] = useState<VariantInput[]>([])
  const [options, setOptions] = useState<OptionInput[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null)
  const [previewSelection, setPreviewSelection] = useState<Record<string, string>>({})
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkCurrency, setBulkCurrency] = useState('usd')

  useEffect(() => {
    if (product) {
      setTitle(product.title || '')
      setDescription(product.description || '')
      setStatus(product.status as 'draft' | 'published')
      
      const productImages = product.images?.map(img => img.url) || []
      setImageLibrary(productImages)
      
      const productOptions: OptionInput[] = product.options?.map(opt => ({
        title: opt.title,
        values: opt.values?.map(v => ({
          value: v.value,
          colorHex: opt.metadata?.values?.[v.value]?.colorHex,
          imageUrl: opt.metadata?.values?.[v.value]?.imageUrl,
        })) || [],
        isColor: opt.values?.some(v => opt.metadata?.values?.[v.value]?.colorHex) || false,
      })) || []
      setOptions(productOptions)
      
      const productVariants: VariantInput[] = product.variants?.map(v => {
        const variantImages = v.images?.map(img => img.url) || []
        return {
          id: v.id,
          optionValues: v.options || {},
          title: v.title,
          sku: v.sku || '',
          price: v.prices?.[0] ? (v.prices[0].amount / 100).toString() : '',
          currency: v.prices?.[0]?.currency_code || 'usd',
          images: variantImages.length > 0 ? variantImages : [],
        }
      }) || [{
        id: 'default',
        optionValues: {},
        title: 'Default',
        sku: '',
        price: '',
        currency: 'usd',
        images: [],
      }]
      setVariants(productVariants)
    }
  }, [product])

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null
    if (variants.length === 1) return variants[0]
    
    const match = variants.find(v => {
      return Object.entries(v.optionValues).every(([key, value]) => previewSelection[key] === value)
    })
    return match || variants[0]
  }, [variants, previewSelection])

  useEffect(() => {
    if (options.length > 0 && Object.keys(previewSelection).length === 0) {
      const initial: Record<string, string> = {}
      options.forEach(opt => {
        if (opt.values.length > 0) {
          initial[opt.title] = opt.values[0].value
        }
      })
      setPreviewSelection(initial)
    }
  }, [options, previewSelection])

  const handleSelectPreviewOption = (optionTitle: string, value: string) => {
    setPreviewSelection(prev => ({ ...prev, [optionTitle]: value }))
  }

  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingVariantId('library')
    try {
      const uploadedFiles = await uploadFiles.mutateAsync(Array.from(files))
      const newUrls = uploadedFiles.map((f) => f.url)
      setImageLibrary(prev => [...prev, ...newUrls.filter(url => !prev.includes(url))])
      setVariants(prev => prev.map(v => ({
        ...v,
        images: [...new Set([...v.images, ...newUrls])]
      })))
      setHasChanges(true)
    } catch (err: any) {
      setError(err.message || 'Failed to upload files')
    } finally {
      setUploadingVariantId(null)
    }
  }

  const toggleImageForVariant = (variantId: string, imageUrl: string) => {
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v
      const hasImage = v.images.includes(imageUrl)
      return {
        ...v,
        images: hasImage 
          ? v.images.filter(img => img !== imageUrl)
          : [...v.images, imageUrl]
      }
    }))
    setHasChanges(true)
  }

  const applyImagesToAllVariants = (imageUrls: string[]) => {
    setVariants(prev => prev.map(v => ({
      ...v,
      images: [...new Set([...v.images, ...imageUrls])]
    })))
    setHasChanges(true)
  }

  const copyImagesFromVariant = (sourceVariantId: string, targetVariantId: string) => {
    const sourceVariant = variants.find(v => v.id === sourceVariantId)
    if (!sourceVariant) return
    setVariants(prev => prev.map(v => 
      v.id === targetVariantId 
        ? { ...v, images: [...new Set([...v.images, ...sourceVariant.images])] }
        : v
    ))
    setHasChanges(true)
  }

  const handleSubmit = async () => {
    setError(null)

    if (!title.trim()) {
      setError('Product title is required')
      return
    }

    const updateData: UpdateProductInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      thumbnail: imageLibrary[0] || undefined,
      images: imageLibrary.map((url, index) => ({ url, rank: index })),
    }

    try {
      const updatedProduct = await updateProduct.mutateAsync(updateData)
      
      for (const variant of variants) {
        const originalVariant = product?.variants?.find(v => v.id === variant.id)
        const originalPrice = originalVariant?.prices?.[0]
        const currentPriceAmount = variant.price ? Math.round(parseFloat(variant.price) * 100) : 0
        const originalPriceAmount = originalPrice?.amount || 0
        
        const priceChanged = currentPriceAmount !== originalPriceAmount || 
          variant.currency !== (originalPrice?.currency_code || 'usd')
        
        if (priceChanged && variant.price) {
          try {
            await api.put(
              `/api/stores/${storeId}/products/${productId}/variants/${variant.id}`,
              { 
                price: Math.round(parseFloat(variant.price) * 100), 
                currency_code: variant.currency 
              }
            )
          } catch (priceErr) {
            console.warn(`Failed to update price for variant ${variant.title}:`, priceErr)
          }
        }
      }
      
      if (updatedProduct.images && updatedProduct.images.length > 0) {
        const imageUrlToId = new Map<string, string>()
        updatedProduct.images.forEach((img) => {
          imageUrlToId.set(img.url, img.id)
        })

        for (const variant of variants) {
          const currentVariantImages = product?.variants?.find(v => v.id === variant.id)?.images || []
          const currentImageIds = new Set(currentVariantImages.map(img => img.id))
          
          const desiredImageIds = variant.images
            .map(url => imageUrlToId.get(url))
            .filter((id): id is string => !!id)
          const desiredSet = new Set(desiredImageIds)

          const toAdd = desiredImageIds.filter(id => !currentImageIds.has(id))
          const toRemove = Array.from(currentImageIds).filter(id => !desiredSet.has(id))

          if (toAdd.length > 0 || toRemove.length > 0) {
            try {
              await api.post(
                `/api/stores/${storeId}/products/${productId}/variants/${variant.id}/images`,
                { add: toAdd.length > 0 ? toAdd : undefined, remove: toRemove.length > 0 ? toRemove : undefined }
              )
            } catch (imgErr) {
              console.warn(`Failed to update images for variant ${variant.title}:`, imgErr)
            }
          }
        }
      }
      
      toast.success('Product updated successfully')
      navigate(paths.app.stores.products.list.getHref(storeId!))
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update product'
      setError(errorMessage)
      toast.error('Failed to update product', {
        description: errorMessage,
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(productId!)
      toast.success('Product deleted successfully')
      navigate(paths.app.stores.products.list.getHref(storeId!))
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete product'
      setError(errorMessage)
      toast.error('Failed to delete product', {
        description: errorMessage,
      })
    }
  }

  const isLoading = storeLoading || productLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!store || !product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Product not found</h2>
        <Button asChild>
          <Link to={paths.app.root.getHref()}>Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const hasMultipleVariants = variants.length > 1

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={paths.app.stores.products.list.getHref(storeId!)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {product.thumbnail ? (
              <img src={product.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{product.title}</h1>
              <p className="text-sm text-muted-foreground">{store.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
            {product.status}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
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
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {error && (
        <div className="shrink-0 mx-6 mt-4 bg-destructive/15 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto h-6 px-2">
            Dismiss
          </Button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-48 xl:w-56 border-r bg-muted/30 p-4 space-y-1 hidden lg:block shrink-0 overflow-y-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                currentTab === tab.id && "bg-primary/10 text-primary",
                currentTab !== tab.id && "text-muted-foreground hover:bg-muted"
              )}
            >
              <div>
                <p className="text-sm font-medium">{tab.title}</p>
                <p className="text-xs text-muted-foreground hidden xl:block">{tab.description}</p>
              </div>
            </button>
          ))}
        </nav>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {currentTab === 'basics' && (
                <BasicsSection
                  title={title}
                  setTitle={(v) => { setTitle(v); setHasChanges(true) }}
                  description={description}
                  setDescription={(v) => { setDescription(v); setHasChanges(true) }}
                  status={status}
                  setStatus={(v) => { setStatus(v); setHasChanges(true) }}
                />
              )}

              {currentTab === 'images' && (
                <ImagesSection
                  imageLibrary={imageLibrary}
                  setImageLibrary={(updater) => {
                    setImageLibrary(updater)
                    setHasChanges(true)
                  }}
                  variants={variants}
                  setVariants={(updater) => {
                    setVariants(updater)
                    setHasChanges(true)
                  }}
                  options={options}
                  hasMultipleVariants={hasMultipleVariants}
                  uploadingVariantId={uploadingVariantId}
                  onLibraryUpload={handleLibraryUpload}
                  onApplyToAll={applyImagesToAllVariants}
                  onCopyFrom={copyImagesFromVariant}
                  onToggleImage={toggleImageForVariant}
                />
              )}

              {currentTab === 'variants' && (
                <PricingSection
                  variants={variants}
                  setVariants={(updater) => {
                    setVariants(updater)
                    setHasChanges(true)
                  }}
                  hasMultipleVariants={hasMultipleVariants}
                  bulkPrice={bulkPrice}
                  setBulkPrice={setBulkPrice}
                  bulkCurrency={bulkCurrency}
                  setBulkCurrency={setBulkCurrency}
                />
              )}

              {currentTab === 'options' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Options</h2>
                    <p className="text-muted-foreground">
                      Product options are set during creation and cannot be modified.
                    </p>
                  </div>

                  {options.length > 0 ? (
                    <div className="space-y-4">
                      {options.map((option, i) => (
                        <div key={i} className="border rounded-xl p-4">
                          <p className="font-medium mb-2">{option.title}</p>
                          <div className="flex flex-wrap gap-2">
                            {option.values.map((v, j) => (
                              <span key={j} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
                                {v.colorHex && (
                                  <div 
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: v.colorHex }}
                                  />
                                )}
                                {v.imageUrl && (
                                  <img src={v.imageUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                                )}
                                {v.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
                      <p>No options defined</p>
                      <p className="text-sm mt-1">This product has a single variant</p>
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'preview' && (
                <FullPagePreview
                  title={title}
                  description={description}
                  options={options}
                  variants={variants}
                  selectedVariant={selectedVariant}
                  onSelectOption={handleSelectPreviewOption}
                />
              )}
            </div>
          </div>

          {currentTab !== 'preview' && (
            <div className="w-80 xl:w-96 border-l bg-muted/30 p-6 hidden lg:block shrink-0 overflow-y-auto">
              <CustomerPreview
                title={title}
                description={description}
                options={options}
                selectedVariant={selectedVariant}
                onSelectOption={handleSelectPreviewOption}
              />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background px-6 py-4 flex justify-between">
        <Button variant="outline" asChild>
          <Link to={paths.app.stores.products.list.getHref(storeId!)}>
            Cancel
          </Link>
        </Button>
        
        <Button onClick={handleSubmit} disabled={updateProduct.isPending || !hasChanges}>
          {updateProduct.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
}
