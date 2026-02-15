import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useProducts,
  useUpdateProduct,
  useDeleteProduct,
  useUploadFiles,
  useUpdateProductOption,
  UpdateProductInput,
} from '@/lib/api/products'
import { useCategories } from '@/lib/api/categories'
import { useInventory } from '@/lib/api/inventory'
import { api } from '@/lib/api-client'
import { useStores } from '@/lib/api/auth'
import { paths, PRODUCT_TABS, type ProductTab } from '@/config/paths'
import { useStoreId } from '../../store-context'
import { generateVariants } from '../variant-utils'
import type { OptionInput, VariantInput, SectionInput } from '../components/product-form-types'

const TABS = Object.values(PRODUCT_TABS)
const TAB_IDS = Object.keys(PRODUCT_TABS) as ProductTab[]

function getOptionsStructure(opts: OptionInput[]): string {
  return opts.map(o => `${o.title}:${o.values.map(v => v.value).join(',')}`).join('|')
}

export function useProductDetail() {
  const storeId = useStoreId()
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { data: storesData, isLoading: storeLoading, error: storeError } = useStores({ id: [storeId!] })
  const store = storesData?.stores[0]
  const { data: productsData, isLoading: productLoading, error: productError } = useProducts(storeId!, { id: [productId!] })
  const product = productsData?.products?.[0]
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories(storeId, { limit: 1000 })
  const allCategories = categoriesData?.categories ?? []
  const categories = useMemo(() => {
    return allCategories.filter(cat => !cat.category_children || cat.category_children.length === 0)
  }, [allCategories])
  const { data: inventoryData } = useInventory(storeId!, { limit: 200 })
  const updateProduct = useUpdateProduct(storeId!, productId!)
  const deleteProduct = useDeleteProduct(storeId!)
  const uploadFiles = useUploadFiles()
  const updateProductOption = useUpdateProductOption(storeId!, productId!)

  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const currentTab: ProductTab = rawTab && TAB_IDS.includes(rawTab as ProductTab) ? (rawTab as ProductTab) : 'basics'
  const setCurrentTab = (tab: ProductTab) => setSearchParams({ tab }, { replace: true })

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

  useEffect(() => {
    if (product) {
      setTitle(product.title || '')
      setDescription(product.description || '')
      setStatus(product.status as 'draft' | 'published')
      setImageLibrary(product.images?.map(img => img.url) || [])
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

      const invItems = inventoryData?.inventory_items || []
      const invByVariant = new Map<string, number>()
      for (const inv of invItems) {
        if (inv.product_id === product.id) {
          invByVariant.set(inv.variant_id, inv.stocked_quantity)
        }
      }

      const productVariants: VariantInput[] = product.variants?.map(v => ({
        id: v.id,
        optionValues: v.options || {},
        title: v.title,
        sku: v.sku || '',
        price: v.prices?.[0] ? (v.prices[0].amount / 100).toString() : '',
        currency: v.prices?.[0]?.currency_code || 'usd',
        images: v.images?.map(img => img.url) || [],
        quantity: invByVariant.get(v.id) ?? 0,
      })) || [{ id: 'default', optionValues: {}, title: 'Default', sku: '', price: '', currency: 'usd', images: [] }]
      setVariants(productVariants)
      setSelectedCategoryIds((product as any).categories?.map((c: any) => c.id) || [])
      setSections((product as any).metadata?.sections || [])
      optionsStructureRef.current = getOptionsStructure(productOptions)
      initialLoadCompleteRef.current = true
    }
  }, [product, inventoryData])

  useEffect(() => {
    if (!initialLoadCompleteRef.current) return
    const newStructure = getOptionsStructure(options)
    if (newStructure === optionsStructureRef.current) return
    optionsStructureRef.current = newStructure
    setVariants(currentVariants => generateVariants(options, currentVariants))
  }, [options])

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null
    if (variants.length === 1) return variants[0]
    return variants.find(v => Object.entries(v.optionValues).every(([key, value]) => previewSelection[key] === value)) || variants[0]
  }, [variants, previewSelection])

  useEffect(() => {
    if (options.length > 0 && Object.keys(previewSelection).length === 0) {
      const initial: Record<string, string> = {}
      options.forEach(opt => { if (opt.values.length > 0) initial[opt.title] = opt.values[0].value })
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
      setVariants(prev => prev.map(v => ({ ...v, images: [...new Set([...v.images, ...newUrls])] })))
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
      return { ...v, images: hasImage ? v.images.filter(img => img !== imageUrl) : [...v.images, imageUrl] }
    }))
    setHasChanges(true)
  }

  const handleValueImageUpload = async (optionIndex: number, valueIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setActiveValueImageUpload({ optionIndex, valueIndex })
    try {
      const uploadedFiles = await uploadFiles.mutateAsync(Array.from(files).slice(0, 1))
      if (uploadedFiles.length > 0) {
        const newOptions = [...options]
        newOptions[optionIndex].values[valueIndex] = { ...newOptions[optionIndex].values[valueIndex], imageUrl: uploadedFiles[0].url }
        setOptions(newOptions)
        setHasChanges(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setActiveValueImageUpload(null)
    }
  }

  const applyImagesToAllVariants = (imageUrls: string[]) => {
    setVariants(prev => prev.map(v => ({ ...v, images: [...new Set([...v.images, ...imageUrls])] })))
    setHasChanges(true)
  }

  const copyImagesFromVariant = (sourceVariantId: string, targetVariantId: string) => {
    const sourceVariant = variants.find(v => v.id === sourceVariantId)
    if (!sourceVariant) return
    setVariants(prev => prev.map(v => v.id === targetVariantId ? { ...v, images: [...new Set([...v.images, ...sourceVariant.images])] } : v))
    setHasChanges(true)
  }

  const handleSubmit = async () => {
    setError(null)
    if (!title.trim()) { setError('Product title is required'); return }

    const variantsWithQuantity = variants
      .filter(v => v.sku && typeof v.quantity === 'number')
      .map(v => ({ id: v.id, sku: v.sku, quantity: v.quantity }))

    const updateData: UpdateProductInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      thumbnail: imageLibrary[0] || undefined,
      images: imageLibrary.map((url, index) => ({ url, rank: index })),
      category_ids: selectedCategoryIds,
      metadata: { sections },
      ...(variantsWithQuantity.length > 0 ? { variants: variantsWithQuantity } : {}),
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
        try { await api.delete(`/api/stores/${storeId}/products/${productId}/variants`, { body: { variant_ids: deletedVariantIds } }) }
        catch (delErr) { console.warn('Failed to delete variants:', delErr) }
      }

      if (newVariants.length > 0) {
        try {
          const createResult = await api.post<{ variants: Array<{ id: string; title: string }> }>(
            `/api/stores/${storeId}/products/${productId}/variants`,
            { variants: newVariants.map(v => ({ title: v.title, sku: v.sku || undefined, options: v.optionValues, prices: v.price ? [{ amount: Math.round(parseFloat(v.price) * 100), currency_code: v.currency }] : undefined })) }
          )
          createResult.variants.forEach((created, index) => { variantIdMap.set(newVariants[index].id, created.id) })
        } catch (createErr) { console.warn('Failed to create variants:', createErr) }
      }

      const variantPriceUpdates: Array<{ id: string; price: number; currency_code: string }> = []
      for (const variant of existingVariants) {
        const originalVariant = product?.variants?.find(v => v.id === variant.id)
        const originalPrice = originalVariant?.prices?.[0]
        const currentPriceAmount = variant.price ? Math.round(parseFloat(variant.price) * 100) : 0
        const priceChanged = currentPriceAmount !== (originalPrice?.amount || 0) || variant.currency !== (originalPrice?.currency_code || 'usd')
        if (priceChanged && variant.price) {
          variantPriceUpdates.push({ id: variant.id, price: Math.round(parseFloat(variant.price) * 100), currency_code: variant.currency })
        }
      }
      if (variantPriceUpdates.length > 0) {
        try { await api.put(`/api/stores/${storeId}/products/${productId}/variants`, variantPriceUpdates) }
        catch (priceErr) { console.warn('Failed to update variant prices:', priceErr) }
      }

      if (updatedProduct.images && updatedProduct.images.length > 0) {
        const imageUrlToId = new Map<string, string>()
        updatedProduct.images.forEach((img) => { imageUrlToId.set(img.url, img.id) })
        for (const variant of existingVariants) {
          const currentVariantImages = product?.variants?.find(v => v.id === variant.id)?.images || []
          const currentImageIds = new Set(currentVariantImages.map(img => img.id))
          const desiredImageIds = variant.images.map(url => imageUrlToId.get(url)).filter((id): id is string => !!id)
          const desiredSet = new Set(desiredImageIds)
          const toAdd = desiredImageIds.filter(id => !currentImageIds.has(id))
          const toRemove = Array.from(currentImageIds).filter(id => !desiredSet.has(id))
          if (toAdd.length > 0 || toRemove.length > 0) {
            try { await api.post(`/api/stores/${storeId}/products/${productId}/variants/${variant.id}/images`, { add: toAdd.length > 0 ? toAdd : undefined, remove: toRemove.length > 0 ? toRemove : undefined }) }
            catch (imgErr) { console.warn(`Failed to update images for variant ${variant.title}:`, imgErr) }
          }
        }
      }

      for (const option of options) {
        const originalOption = product?.options?.find(o => o.title === option.title)
        if (!originalOption) continue
        const newValues = option.values.map(v => v.value)
        const oldValues = (originalOption.values || []).map((v: any) => v.value)
        if (option.title !== originalOption.title || JSON.stringify(newValues) !== JSON.stringify(oldValues)) {
          try { await updateProductOption.mutateAsync({ optionId: originalOption.id, title: option.title, values: newValues }) }
          catch (optErr) { console.warn(`Failed to update option ${option.title}:`, optErr) }
        }
      }

      toast.success('Product updated successfully')
      navigate(paths.app.stores.products.list.getHref(storeId!))
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update product'
      setError(errorMessage)
      toast.error('Failed to update product', { description: errorMessage })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(productId!)
      toast.success('Product deleted successfully')
      navigate(paths.app.stores.products.list.getHref(storeId!))
    } catch (err: any) {
      setError(err.message || 'Failed to delete product')
      toast.error('Failed to delete product', { description: err.message })
    }
  }

  return {
    storeId: storeId!,
    productId: productId!,
    store,
    product,
    isLoading: storeLoading || productLoading,
    isRelationsLoading: categoriesLoading,
    queryError: storeError || productError,
    currentTab,
    setCurrentTab,
    title, setTitle,
    description, setDescription,
    status, setStatus,
    selectedCategoryIds, setSelectedCategoryIds,
    imageLibrary, setImageLibrary,
    variants, setVariants,
    options, setOptions,
    newOptionTitle, setNewOptionTitle,
    newValueInputs, setNewValueInputs,
    selectedValues, setSelectedValues,
    lastClickedValue, setLastClickedValue,
    sections, setSections,
    error, setError,
    hasChanges, setHasChanges,
    uploadingVariantId,
    previewSelection,
    bulkPrice, setBulkPrice,
    bulkCurrency, setBulkCurrency,
    activeValueImageUpload,
    categories,
    selectedVariant,
    hasMultipleVariants: variants.length > 1,
    handleSelectPreviewOption,
    handleLibraryUpload,
    toggleImageForVariant,
    handleValueImageUpload,
    applyImagesToAllVariants,
    copyImagesFromVariant,
    handleSubmit,
    handleDelete,
    updateProduct,
    tabs: TABS,
  }
}
