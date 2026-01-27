import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Check, AlertCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateProduct, useUploadFiles, CreateProductInput, Product } from '@/lib/api/products'
import { api } from '@/lib/api-client'
import { useStore } from '@/lib/api/auth'
import { paths } from '@/config/paths'
import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  OptionInput,
  VariantInput,
  CustomerPreview,
  FullPagePreview,
  BasicsSection,
  OptionsSection,
  PricingSection,
  ImagesSection,
} from './components/product-form'

type Step = 'basics' | 'options' | 'pricing' | 'images' | 'review'

const STEPS: { id: Step; title: string; description: string }[] = [
  { id: 'basics', title: 'Basics', description: 'Name & description' },
  { id: 'options', title: 'Options', description: 'Size, color, etc.' },
  { id: 'pricing', title: 'Pricing', description: 'Set your prices' },
  { id: 'images', title: 'Images', description: 'Product photos' },
  { id: 'review', title: 'Review', description: 'Final check' },
]

function generateVariantId(optionValues: Record<string, string>): string {
  return Object.entries(optionValues)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .join('-')
}

function generateVariants(options: OptionInput[]): VariantInput[] {
  const validOptions = options.filter(o => o.title && o.values.length > 0)
  
  if (validOptions.length === 0) {
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

  return combinations.map(optionValues => ({
    id: generateVariantId(optionValues),
    optionValues,
    title: Object.values(optionValues).join(' / '),
    sku: '',
    price: '',
    currency: 'usd',
    images: [],
  }))
}

export default function NewProductPage() {
  const { id: storeId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: store, isLoading: storeLoading } = useStore(storeId!)
  const createProduct = useCreateProduct(storeId!)
  const uploadFiles = useUploadFiles()

  const [currentStep, setCurrentStep] = useState<Step>('basics')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

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
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null)

  const [previewSelection, setPreviewSelection] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasMultipleVariants = options.some(o => o.values.length > 0)
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  useEffect(() => {
    const newVariants = generateVariants(options)
    setVariants(prev => {
      return newVariants.map(newVar => {
        const existingVar = prev.find(p => p.id === newVar.id)
        if (existingVar) {
          return { ...newVar, sku: existingVar.sku, price: existingVar.price, currency: existingVar.currency, images: existingVar.images }
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
    setVariants(variants.map(v => {
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
    setVariants(variants.map(v => ({
      ...v,
      images: [...new Set([...v.images, ...imageUrls])]
    })))
  }

  const copyImagesFromVariant = (sourceVariantId: string, targetVariantId: string) => {
    const sourceVariant = variants.find(v => v.id === sourceVariantId)
    if (!sourceVariant) return
    setVariants(variants.map(v => 
      v.id === targetVariantId 
        ? { ...v, images: [...new Set([...v.images, ...sourceVariant.images])] }
        : v
    ))
  }

  const getStepStatus = (stepId: Step): 'current' | 'complete' | 'upcoming' => {
    const stepIndex = STEPS.findIndex(s => s.id === stepId)
    if (stepIndex < currentStepIndex) return 'complete'
    if (stepIndex === currentStepIndex) return 'current'
    return 'upcoming'
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'basics':
        return !!title.trim()
      case 'options':
        return true
      case 'pricing':
        return variants.every(v => v.price && parseFloat(v.price) >= 0)
      case 'images':
        return true
      case 'review':
        return true
      default:
        return true
    }
  }

  const canSubmit = () => {
    if (!title.trim()) return false
    if (!variants.every(v => v.price && parseFloat(v.price) >= 0)) return false
    return true
  }

  const goToStep = (step: Step) => setCurrentStep(step)
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
      })),
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
      navigate(paths.app.stores.products.list.getHref(storeId!))
    } catch (err: any) {
      console.error('Product creation error:', err)
      const errorMessage = err.message || 'Failed to create product'
      setError(errorMessage)
      toast.error('Failed to create product', {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Store not found</h2>
        <Button asChild>
          <Link to={paths.app.root.getHref()}>Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-b bg-background">
        <Button variant="ghost" size="icon" asChild>
          <Link to={paths.app.stores.products.list.getHref(storeId!)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">New Product</h1>
          <p className="text-sm text-muted-foreground">{store.name}</p>
        </div>
      </div>

      {error && (
        <div className="shrink-0 mx-6 mt-4 bg-destructive/15 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-48 xl:w-56 border-r bg-muted/30 p-4 space-y-1 hidden lg:block shrink-0 overflow-y-auto">
            {STEPS.map((step, index) => {
              const status = getStepStatus(step.id)
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                    status === 'current' && "bg-primary/10 text-primary",
                    status === 'complete' && "text-muted-foreground hover:bg-muted",
                    status === 'upcoming' && "text-muted-foreground/50"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2",
                    status === 'current' && "border-primary bg-primary text-primary-foreground",
                    status === 'complete' && "border-green-500 bg-green-500 text-white",
                    status === 'upcoming' && "border-muted-foreground/30"
                  )}>
                    {status === 'complete' ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden xl:block">{step.description}</p>
                  </div>
                </button>
              )
            })}
        </nav>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {currentStep === 'basics' && (
                <BasicsSection
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  status={status}
                  setStatus={setStatus}
                  isCreate
                />
              )}

              {currentStep === 'options' && (
                <OptionsSection
                  options={options}
                  setOptions={setOptions}
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

              {currentStep === 'pricing' && (
                <PricingSection
                  variants={variants}
                  setVariants={setVariants}
                  hasMultipleVariants={hasMultipleVariants}
                  bulkPrice={bulkPrice}
                  setBulkPrice={setBulkPrice}
                  bulkCurrency={bulkCurrency}
                  setBulkCurrency={setBulkCurrency}
                />
              )}

              {currentStep === 'images' && (
                <ImagesSection
                  imageLibrary={imageLibrary}
                  setImageLibrary={setImageLibrary}
                  variants={variants}
                  setVariants={setVariants}
                  options={options}
                  hasMultipleVariants={hasMultipleVariants}
                  uploadingVariantId={uploadingVariantId}
                  onLibraryUpload={handleLibraryUpload}
                  onApplyToAll={applyImagesToAllVariants}
                  onCopyFrom={copyImagesFromVariant}
                  onToggleImage={toggleImageForVariant}
                />
              )}

              {currentStep === 'review' && (
                <div className="space-y-6">
                  <div className="text-center pb-4 border-b">
                    <h2 className="text-xl font-semibold mb-1">This is how customers will see your product</h2>
                    <p className="text-muted-foreground">
                      Interact with the preview below. Click "Create Product" when you're ready.
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-6 border">
                    <FullPagePreview
                      title={title}
                      description={description}
                      options={options}
                      selectedVariant={selectedVariant}
                      onSelectOption={handleSelectPreviewOption}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
                    <button type="button" onClick={() => goToStep('basics')} className="underline hover:text-foreground">Edit basics</button>
                    <span>•</span>
                    <button type="button" onClick={() => goToStep('options')} className="underline hover:text-foreground">Edit options</button>
                    <span>•</span>
                    <button type="button" onClick={() => goToStep('pricing')} className="underline hover:text-foreground">Edit pricing</button>
                    <span>•</span>
                    <button type="button" onClick={() => goToStep('images')} className="underline hover:text-foreground">Edit images</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {currentStep !== 'review' && (
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
        <Button
          type="button"
          variant="outline"
          onClick={goPrev}
          disabled={currentStepIndex === 0}
        >
          Back
        </Button>
        
        {currentStep === 'review' ? (
          <Button onClick={handleSubmit} disabled={!canSubmit() || isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Product
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!canProceed()}>
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
