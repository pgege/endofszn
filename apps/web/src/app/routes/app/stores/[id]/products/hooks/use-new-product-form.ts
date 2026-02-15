import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateProduct, useUploadFiles, CreateProductInput } from '@/lib/api/products'
import { useCategories } from '@/lib/api/categories'
import { api } from '@/lib/api-client'
import { useStores } from '@/lib/api/auth'
import { paths, NEW_PRODUCT_STEPS, type NewProductStep } from '@/config/paths'
import { useStoreId } from '../../store-context'
import { generateVariants } from '../variant-utils'
import type { OptionInput, VariantInput, SectionInput } from '../components/product-form-types'

const STEPS = Object.values(NEW_PRODUCT_STEPS)
const STEP_IDS = Object.keys(NEW_PRODUCT_STEPS) as NewProductStep[]

export function useNewProductForm() {
  const storeId = useStoreId()
  const navigate = useNavigate()
  const { data: storesData, isLoading: storeLoading, error: storeError } = useStores({ id: [storeId] })
  const store = storesData?.stores[0]
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories(storeId, { limit: 1000 })
  const allCategories = categoriesData?.categories ?? []
  const categories = useMemo(() => {
    return allCategories.filter(cat => !cat.category_children || cat.category_children.length === 0)
  }, [allCategories])
  const createProduct = useCreateProduct(storeId)
  const uploadFiles = useUploadFiles()

  const [searchParams, setSearchParams] = useSearchParams()
  const rawStep = searchParams.get('step')
  const currentStep: NewProductStep = rawStep && STEP_IDS.includes(rawStep as NewProductStep) ? (rawStep as NewProductStep) : 'basics'
  const setCurrentStep = (step: NewProductStep) => setSearchParams({ step }, { replace: true })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const [options, setOptions] = useState<OptionInput[]>([])
  const [newOptionTitle, setNewOptionTitle] = useState('')
  const [newValueInputs, setNewValueInputs] = useState<Record<number, { value: string; colorHex: string }>>({})
  const [activeValueImageUpload, setActiveValueImageUpload] = useState<{ optionIndex: number; valueIndex: number } | null>(null)
  const [selectedValues, setSelectedValues] = useState<Record<number, Set<number>>>({})
  const [lastClickedValue, setLastClickedValue] = useState<{ optionIndex: number; valueIndex: number } | null>(null)

  const [variants, setVariants] = useState<VariantInput[]>([{
    id: 'default',
    optionValues: {},
    title: 'Default',
    sku: '',
    price: '',
    currency: 'usd',
    images: [],
  }])
  const [imageLibrary, setImageLibrary] = useState<string[]>([])
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkCurrency, setBulkCurrency] = useState('usd')
  const [sections, setSections] = useState<SectionInput[]>([])
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null)

  const [previewSelection, setPreviewSelection] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasMultipleVariants = options.some(o => o.values.length > 0)
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const isLoading = storeLoading || categoriesLoading

  useEffect(() => {
    const newVariants = generateVariants(options)
    setVariants(prev => {
      return newVariants.map(newVar => {
        const existingVar = prev.find(p => p.id === newVar.id)
        if (existingVar) {
          return { ...newVar, sku: existingVar.sku, price: existingVar.price, currency: existingVar.currency, images: existingVar.images, quantity: existingVar.quantity }
        }
        return newVar
      })
    })
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

  const handleUpdateOptionValue = (optionIndex: number, valueIndex: number, updates: Partial<{ colorHex?: string; imageUrl?: string }>) => {
    const newOptions = [...options]
    newOptions[optionIndex].values[valueIndex] = { ...newOptions[optionIndex].values[valueIndex], ...updates }
    setOptions(newOptions)
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

  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingVariantId('library')
    try {
      const uploadedFiles = await uploadFiles.mutateAsync(Array.from(files))
      const newUrls = uploadedFiles.map((f) => f.url)
      setImageLibrary(prev => [...prev, ...newUrls.filter(url => !prev.includes(url))])
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
  }

  const applyImagesToAllVariants = (imageUrls: string[]) => {
    setVariants(prev => prev.map(v => ({
      ...v,
      images: [...new Set([...v.images, ...imageUrls])]
    })))
  }

  const copyImagesFromVariant = (sourceVariantId: string, targetVariantId: string) => {
    setVariants(prev => {
      const sourceVariant = prev.find(v => v.id === sourceVariantId)
      if (!sourceVariant) return prev
      return prev.map(v =>
        v.id === targetVariantId
          ? { ...v, images: [...new Set([...v.images, ...sourceVariant.images])] }
          : v
      )
    })
  }

  const getStepStatus = (stepId: NewProductStep): 'current' | 'complete' | 'upcoming' => {
    const stepIndex = STEPS.findIndex(s => s.id === stepId)
    if (stepIndex < currentStepIndex) return 'complete'
    if (stepIndex === currentStepIndex) return 'current'
    return 'upcoming'
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'basics':
        return !!title.trim()
      case 'pricing':
        return variants.every(v => v.price && parseFloat(v.price) >= 0)
      default:
        return true
    }
  }

  const canSubmit = () => {
    if (!title.trim()) return false
    if (!variants.every(v => v.price && parseFloat(v.price) >= 0)) return false
    return true
  }

  const goToStep = (step: NewProductStep) => setCurrentStep(step)
  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    }
  }
  const goPrev = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)

    if (!canSubmit()) {
      setError('Please fill in all required fields')
      setIsSubmitting(false)
      return
    }

    const finalOptions = options.filter(o => o.title && o.values.length > 0)
    const allImages = [...new Set(variants.flatMap(v => v.images))]
    const thumbnail = allImages[0] || undefined

    const productData: CreateProductInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      thumbnail,
      images: allImages.length > 0 ? allImages.map((url, i) => ({ url, rank: i })) : undefined,
      category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      options: finalOptions.length > 0
        ? finalOptions.map(opt => {
            const valuesMetadata = opt.values.reduce((acc, v) => {
              if (v.colorHex || v.imageUrl) {
                acc[v.value] = { colorHex: v.colorHex, imageUrl: v.imageUrl }
              }
              return acc
            }, {} as Record<string, { colorHex?: string; imageUrl?: string }>)

            return {
              title: opt.title,
              values: opt.values.map(v => v.value),
              ...(Object.keys(valuesMetadata).length > 0 ? { metadata: { values: valuesMetadata } } : {}),
            }
          })
        : [{ title: 'Default', values: ['Default'] }],
      variants: variants.map(v => ({
        title: v.title || 'Default',
        sku: v.sku || undefined,
        options: finalOptions.length > 0 ? v.optionValues : { Default: 'Default' },
        prices: v.price ? [{ amount: Math.round(parseFloat(v.price) * 100), currency_code: v.currency }] : [],
        manage_inventory: true,
        allow_backorder: false,
        ...(typeof v.quantity === 'number' ? { quantity: v.quantity } : {}),
      })),
      metadata: sections.length > 0 ? { sections } : undefined,
    }

    try {
      const createdProduct = await createProduct.mutateAsync(productData)

      if (createdProduct.variants && createdProduct.images && createdProduct.images.length > 0) {
        const imageUrlToId = new Map<string, string>()
        createdProduct.images.forEach((img) => {
          imageUrlToId.set(img.url, img.id)
        })

        for (const createdVariant of createdProduct.variants) {
          const localVariant = variants.find(v => v.title === createdVariant.title)
          if (localVariant && localVariant.images.length > 0) {
            const imageIds = localVariant.images
              .map(url => imageUrlToId.get(url))
              .filter((id): id is string => !!id)

            if (imageIds.length > 0) {
              try {
                await api.post(
                  `/api/stores/${storeId}/products/${createdProduct.id}/variants/${createdVariant.id}/images`,
                  { add: imageIds }
                )
              } catch (imgErr) {
                console.warn(`Failed to save images for variant ${createdVariant.title}:`, imgErr)
              }
            }
          }
        }
      }

      toast.success('Product created successfully')
      navigate(paths.app.stores.products.list.getHref(storeId))
    } catch (err: any) {
      console.error('Product creation error:', err)
      const errorMessage = err.message || 'Failed to create product'
      setError(errorMessage)
      toast.error('Failed to create product', { description: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    storeId,
    store,
    isLoading,
    storeError,
    categories,
    currentStep,
    currentStepIndex,
    steps: STEPS,
    title, setTitle,
    description, setDescription,
    status, setStatus,
    selectedCategoryIds, setSelectedCategoryIds,
    options, setOptions,
    newOptionTitle, setNewOptionTitle,
    newValueInputs, setNewValueInputs,
    activeValueImageUpload,
    selectedValues, setSelectedValues,
    lastClickedValue, setLastClickedValue,
    variants, setVariants,
    imageLibrary, setImageLibrary,
    bulkPrice, setBulkPrice,
    bulkCurrency, setBulkCurrency,
    sections, setSections,
    uploadingVariantId,
    previewSelection,
    selectedVariant,
    hasMultipleVariants,
    error,
    isSubmitting,
    getStepStatus,
    canProceed,
    canSubmit,
    goToStep,
    goNext,
    goPrev,
    handleSubmit,
    handleSelectPreviewOption,
    handleValueImageUpload,
    handleLibraryUpload,
    toggleImageForVariant,
    applyImagesToAllVariants,
    copyImagesFromVariant,
  }
}
