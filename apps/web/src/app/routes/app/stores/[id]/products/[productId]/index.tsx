import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, Trash2, Package } from 'lucide-react'
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
  useUpdateProductOption,
  UpdateProductInput,
} from '@/lib/api/products'
import { useCategories } from '@/lib/api/categories'
import { api } from '@/lib/api-client'
import { useStore } from '@/lib/api/auth'
import { paths } from '@/config/paths'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  OptionsSection,
  ProductSectionsSection,
  SectionInput,
} from '../components/product-form'

type Tab = 'basics' | 'images' | 'variants' | 'options' | 'info' | 'preview'

const TABS: { id: Tab; title: string; description: string }[] = [
  { id: 'basics', title: 'Basics', description: 'Name & description' },
  { id: 'images', title: 'Images', description: 'Product photos' },
  { id: 'variants', title: 'Pricing', description: 'Variant prices' },
  { id: 'options', title: 'Options', description: 'Size, color, etc.' },
  { id: 'info', title: 'Info', description: 'Extra details' },
  { id: 'preview', title: 'Preview', description: 'Customer view' },
]

function generateVariantId(optionValues: Record<string, string>): string {
  return Object.entries(optionValues)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .join('-')
}

function generateVariants(options: OptionInput[], existingVariants: VariantInput[]): VariantInput[] {
  const validOptions = options.filter(o => o.title && o.values.length > 0)
  
  if (validOptions.length === 0) {
    const existing = existingVariants.find(v => v.title === 'Default' || Object.keys(v.optionValues).length === 0)
    if (existing) {
      return [existing]
    }
    return [{
      id: 'default',
      optionValues: {},
      title: 'Default',
      sku: '',
      price: '',
      currency: 'usd',
      images: [],
    }]
  }

  const combinations: Record<string, string>[] = [{}]
  
  for (const option of validOptions) {
    const newCombinations: Record<string, string>[] = []
    for (const combo of combinations) {
      for (const optVal of option.values) {
        newCombinations.push({ ...combo, [option.title]: optVal.value })
      }
    }
    combinations.length = 0
    combinations.push(...newCombinations)
  }

  return combinations.map(optionValues => {
    const generatedId = generateVariantId(optionValues)
    const title = Object.values(optionValues).join(' / ')
    
    const existingVar = existingVariants.find(v => {
      const existingGenId = generateVariantId(v.optionValues)
      return existingGenId === generatedId
    })

    if (existingVar) {
      return { ...existingVar, optionValues, title }
    }

    return {
      id: generatedId,
      optionValues,
      title,
      sku: '',
      price: '',
      currency: 'usd',
      images: [],
    }
  })
}

export default function ProductDetailPage() {
  const { id: storeId, productId } = useParams<{ id: string; productId: string }>()
  const navigate = useNavigate()
  const { data: store, isLoading: storeLoading, error: storeError } = useStore(storeId!)
  const { data: product, isLoading: productLoading, error: productError } = useProduct(storeId!, productId!)
  const { data: allCategories = [], isLoading: categoriesLoading } = useCategories(storeId)
  const categories = useMemo(() => {
    return allCategories.filter(cat => !cat.category_children || cat.category_children.length === 0)
  }, [allCategories])
  const updateProduct = useUpdateProduct(storeId!, productId!)
  const deleteProduct = useDeleteProduct(storeId!)
  const uploadFiles = useUploadFiles()
  const updateProductOption = useUpdateProductOption(storeId!, productId!)

  const [currentTab, setCurrentTab] = useState<Tab>('basics')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [imageLibrary, setImageLibrary] = useState<string[]>([])
  const [variants, setVariants] = useState<VariantInput[]>([])
  const [options, setOptions] = useState<OptionInput[]>([])
  const [newOptionTitle, setNewOptionTitle] = useState('')
  const [newValueInputs, setNewValueInputs] = useState<Record<number, { value: string; colorHex: string }>>({})
  const [selectedValues, setSelectedValues] = useState<Record<number, Set<number>>>({})
  const [lastClickedValue, setLastClickedValue] = useState<{ optionIndex: number; valueIndex: number } | null>(null)
  const [sections, setSections] = useState<SectionInput[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null)
  const [previewSelection, setPreviewSelection] = useState<Record<string, string>>({})
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkCurrency, setBulkCurrency] = useState('usd')
  const [activeValueImageUpload, setActiveValueImageUpload] = useState<{ optionIndex: number; valueIndex: number } | null>(null)
  const initialLoadCompleteRef = useRef(false)
  const optionsStructureRef = useRef('')

  const getOptionsStructure = (opts: OptionInput[]): string => {
    return opts.map(o => `${o.title}:${o.values.map(v => v.value).join(',')}`).join('|')
  }

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
      
      const productCategoryIds = (product as any).categories?.map((c: any) => c.id) || []
      setSelectedCategoryIds(productCategoryIds)
      
      const productSections = (product as any).metadata?.sections || []
      setSections(productSections)
      
      optionsStructureRef.current = getOptionsStructure(productOptions)
      initialLoadCompleteRef.current = true
    }
  }, [product])

  useEffect(() => {
    if (!initialLoadCompleteRef.current) return
    
    const newStructure = getOptionsStructure(options)
    if (newStructure === optionsStructureRef.current) {
      return
    }
    
    optionsStructureRef.current = newStructure
    setVariants(currentVariants => generateVariants(options, currentVariants))
  }, [options])

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

  const handleUpdateOptionValue = (optionIndex: number, valueIndex: number, updates: { colorHex?: string; imageUrl?: string }) => {
    const newOptions = [...options]
    newOptions[optionIndex].values[valueIndex] = { 
      ...newOptions[optionIndex].values[valueIndex], 
      ...updates 
    }
    setOptions(newOptions)
    setHasChanges(true)
  }

  const handleValueImageUpload = async (optionIndex: number, valueIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setActiveValueImageUpload({ optionIndex, valueIndex })
    try {
      const uploadedFiles = await uploadFiles.mutateAsync(Array.from(files).slice(0, 1))
      if (uploadedFiles.length > 0) {
        handleUpdateOptionValue(optionIndex, valueIndex, { imageUrl: uploadedFiles[0].url })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setActiveValueImageUpload(null)
    }
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
      category_ids: selectedCategoryIds,
      metadata: { sections },
    }

    try {
      const updatedProduct = await updateProduct.mutateAsync(updateData)
      
      const originalVariantIds = new Set(product?.variants?.map(v => v.id) || [])
      const currentVariantIds = new Set(variants.map(v => v.id))
      
      const newVariants = variants.filter(v => !originalVariantIds.has(v.id))
      const deletedVariantIds = Array.from(originalVariantIds).filter(id => !currentVariantIds.has(id))
      const existingVariants = variants.filter(v => originalVariantIds.has(v.id))

      const variantIdMap = new Map<string, string>()
      variants.forEach(v => variantIdMap.set(v.id, v.id))

      if (deletedVariantIds.length > 0) {
        try {
          await api.delete(`/api/stores/${storeId}/products/${productId}/variants`, {
            body: { variant_ids: deletedVariantIds }
          })
        } catch (delErr) {
          console.warn('Failed to delete variants:', delErr)
        }
      }

      if (newVariants.length > 0) {
        try {
          const createResult = await api.post<{ variants: Array<{ id: string; title: string }> }>(
            `/api/stores/${storeId}/products/${productId}/variants`,
            {
              variants: newVariants.map(v => ({
                title: v.title,
                sku: v.sku || undefined,
                options: v.optionValues,
                prices: v.price ? [{ amount: Math.round(parseFloat(v.price) * 100), currency_code: v.currency }] : undefined,
              }))
            }
          )
          createResult.variants.forEach((created, index) => {
            variantIdMap.set(newVariants[index].id, created.id)
          })
        } catch (createErr) {
          console.warn('Failed to create variants:', createErr)
        }
      }

      for (const variant of existingVariants) {
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

        for (const variant of existingVariants) {
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

      for (const option of options) {
        const originalOption = product?.options?.find(o => o.title === option.title)
        if (!originalOption) continue

        const valuesMetadata = option.values.reduce((acc, v) => {
          if (v.colorHex || v.imageUrl) {
            acc[v.value] = { colorHex: v.colorHex, imageUrl: v.imageUrl }
          }
          return acc
        }, {} as Record<string, { colorHex?: string; imageUrl?: string }>)

        const originalMetadata = originalOption.metadata?.values || {}
        const metadataChanged = JSON.stringify(valuesMetadata) !== JSON.stringify(originalMetadata)

        if (metadataChanged) {
          try {
            await updateProductOption.mutateAsync({
              optionId: originalOption.id,
              metadata: { values: valuesMetadata },
            })
          } catch (optErr) {
            console.warn(`Failed to update option ${option.title}:`, optErr)
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

  const isLoading = storeLoading || productLoading || categoriesLoading
  const queryError = storeError || productError

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (queryError || !store || !product) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {!store ? 'Store not found' : 'Product not found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {queryError?.message || 'The requested resource could not be found'}
          </p>
          <Button asChild>
            <Link to={paths.app.root.getHref()}>Back to Dashboard</Link>
          </Button>
        </div>
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
                  categories={categories}
                  selectedCategoryIds={selectedCategoryIds}
                  setSelectedCategoryIds={(ids) => { setSelectedCategoryIds(ids); setHasChanges(true) }}
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
                  _onCopyFrom={copyImagesFromVariant}
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
                <OptionsSection
                  options={options}
                  setOptions={(updater) => {
                    setOptions(updater)
                    setHasChanges(true)
                  }}
                  newOptionTitle={newOptionTitle}
                  setNewOptionTitle={setNewOptionTitle}
                  newValueInputs={newValueInputs}
                  setNewValueInputs={setNewValueInputs}
                  selectedValues={selectedValues}
                  setSelectedValues={setSelectedValues}
                  lastClickedValue={lastClickedValue}
                  setLastClickedValue={setLastClickedValue}
                  onUploadValueImage={handleValueImageUpload}
                  activeValueImageUpload={activeValueImageUpload}
                />
              )}

              {currentTab === 'info' && (
                <ProductSectionsSection
                  sections={sections}
                  setSections={(updater) => {
                    setSections(updater)
                    setHasChanges(true)
                  }}
                />
              )}

              {currentTab === 'preview' && (
                <FullPagePreview
                  title={title}
                  description={description}
                  options={options}
                  selectedVariant={selectedVariant}
                  onSelectOption={handleSelectPreviewOption}
                  sections={sections}
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
