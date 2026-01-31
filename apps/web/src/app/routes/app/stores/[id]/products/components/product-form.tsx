import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Upload, Loader2, Check, ImageIcon, ChevronLeft, ChevronDown, Eye, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { RichTextEditor, RichTextPreview } from '@/components/ui/rich-text-editor'
import { cn } from '@/lib/utils'

export interface OptionValueInput {
  value: string
  colorHex?: string
  imageUrl?: string
}

export interface OptionInput {
  title: string
  values: OptionValueInput[]
  isColor?: boolean
}

export interface VariantInput {
  id: string
  optionValues: Record<string, string>
  title: string
  sku: string
  price: string
  currency: string
  images: string[]
}

export function ImageGallery({ images, selectedIndex, onSelect }: { 
  images: string[]
  selectedIndex: number
  onSelect: (index: number) => void 
}) {
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No image yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-muted rounded-lg overflow-hidden relative group">
        <img src={images[selectedIndex]} alt="" className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onSelect(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelect(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors",
                i === selectedIndex ? "border-primary" : "border-transparent hover:border-muted-foreground"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function OptionSelector({ 
  options, 
  selectedValues, 
  onSelect 
}: { 
  options: OptionInput[]
  selectedValues: Record<string, string>
  onSelect: (optionTitle: string, value: string) => void
}) {
  return (
    <div className="space-y-4">
      {options.filter(o => o.values.length > 0).map((option) => {
        const selectedValue = selectedValues[option.title]
        return (
          <div key={option.title} className="space-y-2">
            <Label className="text-sm font-medium">{option.title}</Label>
            <div className="flex flex-wrap gap-2">
              {option.values.map((v) => {
                const isSelected = selectedValue === v.value
                const hasColor = !!v.colorHex
                const hasImage = !!v.imageUrl

                if (hasColor) {
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => onSelect(option.title, v.value)}
                      className={cn(
                        "w-9 h-9 rounded-full border-2 transition-all",
                        isSelected ? "ring-2 ring-primary ring-offset-2 border-primary" : "border-muted hover:scale-110"
                      )}
                      style={{ backgroundColor: v.colorHex }}
                      title={v.value}
                    />
                  )
                }

                if (hasImage) {
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => onSelect(option.title, v.value)}
                      className={cn(
                        "w-14 h-14 rounded-lg border-2 overflow-hidden transition-all",
                        isSelected ? "ring-2 ring-primary ring-offset-2 border-primary" : "border-muted hover:border-primary"
                      )}
                      title={v.value}
                    >
                      <img src={v.imageUrl} alt={v.value} className="w-full h-full object-cover" />
                    </button>
                  )
                }

                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => onSelect(option.title, v.value)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "border-input hover:border-primary"
                    )}
                  >
                    {v.value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CollapsibleDescription({ description, expanded = false }: { description: string; expanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(expanded)
  
  if (!description || description === '<p></p>') return null
  
  const hasLongContent = description.length > 200

  return (
    <div className="space-y-2">
      <div className={cn(!isExpanded && hasLongContent && "relative")}>
        <RichTextPreview 
          content={description} 
          collapsed={!isExpanded && hasLongContent}
          className="text-muted-foreground"
        />
        {!isExpanded && hasLongContent && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-background to-transparent" />
        )}
      </div>
      {hasLongContent && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          {isExpanded ? 'Show less' : 'Read more'}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
        </button>
      )}
    </div>
  )
}

export function CustomerPreview({ 
  title, 
  description, 
  options, 
  selectedVariant,
  onSelectOption,
}: { 
  title: string
  description: string
  options: OptionInput[]
  selectedVariant: VariantInput | null
  onSelectOption: (optionTitle: string, value: string) => void
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  const displayImages = selectedVariant?.images || []
  const displayPrice = selectedVariant?.price

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [selectedVariant?.id])

  return (
    <div className="bg-background border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        <span>Customer Preview</span>
      </div>
      
      <ImageGallery 
        images={displayImages} 
        selectedIndex={selectedImageIndex} 
        onSelect={setSelectedImageIndex} 
      />
      
      <div>
        <h2 className="text-xl font-bold">
          {title || <span className="text-muted-foreground">Product Title</span>}
        </h2>
        {displayPrice && (
          <p className="text-2xl font-bold text-primary mt-1">
            ${displayPrice} <span className="text-sm font-normal text-muted-foreground">{selectedVariant?.currency.toUpperCase()}</span>
          </p>
        )}
      </div>

      <CollapsibleDescription description={description} />

      <OptionSelector 
        options={options} 
        selectedValues={selectedVariant?.optionValues || {}} 
        onSelect={onSelectOption} 
      />

      <Button className="w-full" size="lg" disabled>
        Add to Cart
      </Button>
    </div>
  )
}

export function FullPagePreview({ 
  title, 
  description, 
  options, 
  selectedVariant,
  onSelectOption,
}: { 
  title: string
  description: string
  options: OptionInput[]
  selectedVariant: VariantInput | null
  onSelectOption: (optionTitle: string, value: string) => void
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  const displayImages = selectedVariant?.images || []
  const displayPrice = selectedVariant?.price

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [selectedVariant?.id])

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <ImageGallery 
        images={displayImages} 
        selectedIndex={selectedImageIndex} 
        onSelect={setSelectedImageIndex} 
      />
      
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">
            {title || <span className="text-muted-foreground">Product Title</span>}
          </h2>
          {displayPrice && (
            <p className="text-3xl font-bold text-primary mt-2">
              ${displayPrice} <span className="text-base font-normal text-muted-foreground">{selectedVariant?.currency.toUpperCase()}</span>
            </p>
          )}
        </div>

        <CollapsibleDescription description={description} expanded />

        <OptionSelector 
          options={options} 
          selectedValues={selectedVariant?.optionValues || {}} 
          onSelect={onSelectOption} 
        />

        <Button className="w-full" size="lg" disabled>
          Add to Cart
        </Button>
      </div>
    </div>
  )
}

type CategoryOption = {
  id: string
  name: string
  parent_category: CategoryOption | null
}

export function BasicsSection({
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  categories = [],
  selectedCategoryIds = [],
  setSelectedCategoryIds,
  isCreate = false,
}: {
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  status: 'draft' | 'published'
  setStatus: (v: 'draft' | 'published') => void
  categories?: CategoryOption[]
  selectedCategoryIds?: string[]
  setSelectedCategoryIds?: (ids: string[]) => void
  isCreate?: boolean
}) {
  const toggleCategory = (categoryId: string) => {
    if (!setSelectedCategoryIds) return
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId))
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId])
    }
  }

  const getCategoryPath = (category: CategoryOption): string => {
    if (category.parent_category) {
      return `${getCategoryPath(category.parent_category)} > ${category.name}`
    }
    return category.name
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">
          {isCreate ? "Let's start with the basics" : "Basic Information"}
        </h2>
        <p className="text-muted-foreground">
          {isCreate ? "What are you selling? Give it a name and description." : "Edit the main details about your product."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base">
            Product name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter product name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-base">Description</Label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Tell customers about your product..."
          />
        </div>

        {categories.length > 0 && setSelectedCategoryIds && (
          <div className="space-y-2">
            <Label className="text-base">Categories</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select one or more categories for this product
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-sm transition-colors",
                    selectedCategoryIds.includes(category.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:border-primary"
                  )}
                >
                  {getCategoryPath(category)}
                </button>
              ))}
            </div>
            {selectedCategoryIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-base">Visibility</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus('draft')}
              className={cn(
                "flex-1 p-4 rounded-xl border-2 text-left transition-colors",
                status === 'draft' ? "border-primary bg-primary/5" : "border-input hover:border-muted-foreground"
              )}
            >
              <p className="font-medium">Draft</p>
              <p className="text-sm text-muted-foreground">Not visible to customers</p>
            </button>
            <button
              type="button"
              onClick={() => setStatus('published')}
              className={cn(
                "flex-1 p-4 rounded-xl border-2 text-left transition-colors",
                status === 'published' ? "border-primary bg-primary/5" : "border-input hover:border-muted-foreground"
              )}
            >
              <p className="font-medium">Published</p>
              <p className="text-sm text-muted-foreground">Visible in your store</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ImagesSection({
  imageLibrary,
  setImageLibrary,
  variants,
  setVariants,
  options,
  hasMultipleVariants,
  uploadingVariantId,
  onLibraryUpload,
  onApplyToAll,
  _onCopyFrom,
  onToggleImage,
}: {
  imageLibrary: string[]
  setImageLibrary: React.Dispatch<React.SetStateAction<string[]>>
  variants: VariantInput[]
  setVariants: React.Dispatch<React.SetStateAction<VariantInput[]>>
  options?: OptionInput[]
  hasMultipleVariants: boolean
  uploadingVariantId: string | null
  onLibraryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onApplyToAll: (urls: string[]) => void
  _onCopyFrom: (sourceId: string, targetId: string) => void
  onToggleImage: (variantId: string, imageUrl: string) => void
}) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set())
  const [showVariantPicker, setShowVariantPicker] = useState(false)
  const [variantSearch, setVariantSearch] = useState('')
  const [variantFilter, setVariantFilter] = useState<Record<string, string>>({})

  const toggleImageSelection = (url: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else {
        next.add(url)
      }
      return next
    })
  }

  const toggleVariantSelection = (id: string) => {
    setSelectedVariantIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAssignImages = () => {
    if (selectedImages.size === 0 || selectedVariantIds.size === 0) return
    
    const imagesToAdd = Array.from(selectedImages)
    setVariants(prev => prev.map(v => {
      if (selectedVariantIds.has(v.id)) {
        const newImages = [...new Set([...v.images, ...imagesToAdd])]
        return { ...v, images: newImages }
      }
      return v
    }))
    
    setSelectedImages(new Set())
    setSelectedVariantIds(new Set())
    setShowVariantPicker(false)
    setVariantSearch('')
    setVariantFilter({})
  }

  const handleAssignToAll = () => {
    if (selectedImages.size === 0) return
    const imagesToAdd = Array.from(selectedImages)
    onApplyToAll(imagesToAdd)
    setSelectedImages(new Set())
  }

  const optionStructure = useMemo(() => {
    const numericSort = (a: string, b: string): number => {
      const numA = parseFloat(a)
      const numB = parseFloat(b)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.localeCompare(b, undefined, { numeric: true })
    }

    const optionKeys = Object.keys(variants[0]?.optionValues || {})
    
    if (optionKeys.length === 0 || !variants[0]?.optionValues[optionKeys[0]]) {
      if (variants.length <= 1) {
        return { keys: [], valuesByKey: {} as Record<string, string[]>, variantLookup: new Map<string, VariantInput>() }
      }
      
      const titleParts = variants.map(v => v.title.split(' / '))
      const maxParts = Math.max(...titleParts.map(p => p.length))
      
      if (maxParts <= 1) {
        const values = variants.map(v => v.title).sort(numericSort)
        const lookup = new Map<string, VariantInput>()
        variants.forEach(v => lookup.set(v.title, v))
        return { keys: ['Variant'], valuesByKey: { 'Variant': values }, variantLookup: lookup }
      }
      
      const keys: string[] = []
      const valuesByKey: Record<string, Set<string>> = {}
      
      for (let i = 0; i < maxParts; i++) {
        const key = options?.[i]?.title || `Option ${i + 1}`
        keys.push(key)
        valuesByKey[key] = new Set()
        titleParts.forEach(parts => {
          if (parts[i]) valuesByKey[key].add(parts[i].trim())
        })
      }
      
      const sortedKeys = [...keys].sort((a, b) => valuesByKey[a].size - valuesByKey[b].size)
      const sortedValuesByKey: Record<string, string[]> = {}
      for (const key of sortedKeys) {
        sortedValuesByKey[key] = Array.from(valuesByKey[key]).sort(numericSort)
      }
      
      const lookup = new Map<string, VariantInput>()
      variants.forEach(v => {
        const parts = v.title.split(' / ').map(p => p.trim())
        const lookupKey = sortedKeys.map(k => {
          const originalIndex = keys.indexOf(k)
          return parts[originalIndex] || ''
        }).join('|||')
        lookup.set(lookupKey, v)
      })
      
      return { keys: sortedKeys, valuesByKey: sortedValuesByKey, variantLookup: lookup, parsedFromTitle: true, originalKeys: keys }
    }
    
    const valuesByKey: Record<string, Set<string>> = {}
    for (const key of optionKeys) {
      valuesByKey[key] = new Set()
    }
    for (const variant of variants) {
      for (const key of optionKeys) {
        if (variant.optionValues[key]) {
          valuesByKey[key].add(variant.optionValues[key])
        }
      }
    }
    
    const sortedKeys = [...optionKeys].sort((a, b) => valuesByKey[a].size - valuesByKey[b].size)
    const sortedValuesByKey: Record<string, string[]> = {}
    for (const key of sortedKeys) {
      sortedValuesByKey[key] = Array.from(valuesByKey[key]).sort(numericSort)
    }
    
    const lookup = new Map<string, VariantInput>()
    variants.forEach(v => {
      const lookupKey = sortedKeys.map(k => v.optionValues[k] || '').join('|||')
      lookup.set(lookupKey, v)
    })
    
    return { keys: sortedKeys, valuesByKey: sortedValuesByKey, variantLookup: lookup }
  }, [variants, options])

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  
  useEffect(() => {
    if (optionStructure.keys.length > 0 && Object.keys(selectedOptions).length === 0) {
      const initial: Record<string, string> = {}
      for (const key of optionStructure.keys) {
        initial[key] = optionStructure.valuesByKey[key][0] || ''
      }
      setSelectedOptions(initial)
    }
  }, [optionStructure, selectedOptions])

  const selectedVariant = useMemo(() => {
    if (variants.length === 1) return variants[0]
    if (optionStructure.keys.length === 0) return variants[0]
    const lookupKey = optionStructure.keys.map(k => selectedOptions[k] || '').join('|||')
    return optionStructure.variantLookup?.get(lookupKey) || variants[0]
  }, [variants, optionStructure, selectedOptions])

  const configuredCount = useMemo(() => {
    return variants.filter(v => v.images.length > 0).length
  }, [variants])

  const filteredVariants = useMemo(() => {
    let result = variants
    
    if (variantSearch.trim()) {
      const search = variantSearch.toLowerCase()
      result = result.filter(v => v.title.toLowerCase().includes(search))
    }
    
    for (const [key, value] of Object.entries(variantFilter)) {
      if (value) {
        result = result.filter(v => {
          if (v.optionValues[key]) {
            return v.optionValues[key] === value
          }
          const parts = v.title.split(' / ').map(p => p.trim())
          const keyIndex = optionStructure.originalKeys?.indexOf(key) ?? optionStructure.keys.indexOf(key)
          return parts[keyIndex] === value
        })
      }
    }
    
    return result
  }, [variants, variantSearch, variantFilter, optionStructure])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Add product images</h2>
          <p className="text-muted-foreground">
            Upload images, select them, then assign to variants.
          </p>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="p-4 bg-muted/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-medium">Image Library</span>
              <span className="text-sm text-muted-foreground">
                {selectedImages.size > 0 
                  ? `${selectedImages.size} selected` 
                  : `${imageLibrary.length} images`
                }
              </span>
              {selectedImages.size > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedImages(new Set())}>
                  Clear
                </Button>
              )}
              {imageLibrary.length > 0 && selectedImages.size < imageLibrary.length && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedImages(new Set(imageLibrary))}>
                  Select all
                </Button>
              )}
            </div>
            
            {hasMultipleVariants && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      type="button"
                      disabled={selectedImages.size === 0}
                      onClick={() => setShowVariantPicker(true)}
                      className="gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Assign to Variants
                    </Button>
                  </span>
                </TooltipTrigger>
                {selectedImages.size === 0 && (
                  <TooltipContent>
                    <p>Select images first by clicking on them</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
          
          <div className="p-4">
            {imageLibrary.length > 0 && (
              <p className="text-sm text-muted-foreground mb-3">
                Click images to select them{hasMultipleVariants ? ', then use "Assign to Variants" above' : ''}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {imageLibrary.map((url, index) => {
                const isSelected = selectedImages.has(url)
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleImageSelection(url)}
                    className={cn(
                      "relative w-20 h-20 rounded-lg overflow-hidden transition-all group",
                      isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:ring-2 hover:ring-muted-foreground hover:ring-offset-2"
                    )}
                  >
                    <img src={url} alt="" className="object-cover w-full h-full" />
                    <div className={cn(
                      "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-black/50 opacity-0 group-hover:opacity-100"
                    )}>
                      <Check className="h-3 w-3" />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute bottom-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        setImageLibrary(prev => prev.filter((_, i) => i !== index))
                        setVariants(prev => prev.map(v => ({ ...v, images: v.images.filter(img => img !== url) })))
                        setSelectedImages(prev => { const next = new Set(prev); next.delete(url); return next })
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </button>
                )
              })}
              <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <input type="file" multiple accept="image/*" className="hidden" onChange={onLibraryUpload} />
                {uploadingVariantId === 'library' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </>
                )}
              </label>
            </div>
            {imageLibrary.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Upload images to get started</p>
            )}
          </div>
        </div>

        <Dialog open={showVariantPicker} onOpenChange={(open) => {
          setShowVariantPicker(open)
          if (!open) {
            setSelectedVariantIds(new Set())
            setVariantSearch('')
            setVariantFilter({})
          }
        }}>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from(selectedImages).slice(0, 4).map((url, i) => (
                    <div key={i} className="w-8 h-8 rounded overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {selectedImages.size > 4 && (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs">
                      +{selectedImages.size - 4}
                    </div>
                  )}
                </div>
                <span>Assign {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                  placeholder="Search variants..."
                  className="pl-9"
                />
              </div>
              
              {optionStructure.keys.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {optionStructure.keys.map((key) => (
                    <Select 
                      key={key}
                      value={variantFilter[key] || 'all'} 
                      onValueChange={(val) => setVariantFilter(prev => ({ ...prev, [key]: val === 'all' ? '' : val }))}
                    >
                      <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue placeholder={key} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {key}</SelectItem>
                        {optionStructure.valuesByKey[key].map((val) => (
                          <SelectItem key={val} value={val}>{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedVariantIds(new Set(filteredVariants.map(v => v.id)))}>
                    Select all ({filteredVariants.length})
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedVariantIds(new Set())}>
                    Clear
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">{selectedVariantIds.size} selected</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto border rounded-lg divide-y min-h-[200px] max-h-[300px]">
              {filteredVariants.length > 0 ? (
                filteredVariants.map((variant) => {
                  const isSelected = selectedVariantIds.has(variant.id)
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => toggleVariantSelection(variant.id)}
                      className={cn(
                        "w-full p-3 flex items-center gap-3 text-left transition-colors",
                        isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {variant.images.slice(0, 2).map((img, i) => (
                          <div key={i} className="w-8 h-8 rounded overflow-hidden bg-muted">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {variant.images.length === 0 && (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{variant.title}</p>
                        <p className="text-xs text-muted-foreground">{variant.images.length} images</p>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No variants match your filters</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onApplyToAll(Array.from(selectedImages))
                  setSelectedImages(new Set())
                  setShowVariantPicker(false)
                }}
              >
                All variants
              </Button>
              <Button 
                type="button" 
                className="flex-1"
                disabled={selectedVariantIds.size === 0} 
                onClick={handleAssignImages}
              >
                Assign to {selectedVariantIds.size || '...'} selected
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {hasMultipleVariants && (
          <div className="border rounded-xl overflow-hidden">
            <div className="p-4 bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Edit single variant</h3>
                <span className="text-sm text-muted-foreground">{configuredCount} of {variants.length} have images</span>
              </div>
              <div className="space-y-3">
                {optionStructure.keys.map((optionKey) => {
                  const values = optionStructure.valuesByKey[optionKey]
                  const currentValue = selectedOptions[optionKey]
                  const isSmallSet = values.length <= 6
                  
                  return (
                    <div key={optionKey}>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">{optionKey}</Label>
                      {isSmallSet ? (
                        <div className="flex flex-wrap gap-2">
                          {values.map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setSelectedOptions(prev => ({ ...prev, [optionKey]: value }))}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                currentValue === value ? "bg-primary text-primary-foreground" : "bg-background border hover:border-primary"
                              )}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Select value={currentValue} onValueChange={(val) => setSelectedOptions(prev => ({ ...prev, [optionKey]: val }))}>
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder={`Select ${optionKey}`} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px]">
                            {values.map((value) => (
                              <SelectItem key={value} value={value}>{value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {selectedVariant && (
              <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{selectedVariant.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedVariant.images.length} images</p>
                  </div>
                  {selectedVariant.images.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      setVariants(prev => prev.map(v => v.id === selectedVariant.id ? { ...v, images: [] } : v))
                    }}>
                      Clear
                    </Button>
                  )}
                </div>
                
                {imageLibrary.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {imageLibrary.map((url, imgIndex) => {
                      const isAssigned = selectedVariant.images.includes(url)
                      const assignedIndex = selectedVariant.images.indexOf(url)
                      return (
                        <button
                          key={imgIndex}
                          type="button"
                          onClick={() => onToggleImage(selectedVariant.id, url)}
                          className={cn(
                            "relative w-14 h-14 rounded-lg overflow-hidden transition-all",
                            isAssigned ? "ring-2 ring-primary ring-offset-1" : "opacity-40 hover:opacity-100"
                          )}
                        >
                          <img src={url} alt="" className="object-cover w-full h-full" />
                          {isAssigned && assignedIndex === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] text-center">Main</div>
                          )}
                          {isAssigned && (
                            <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground w-3.5 h-3.5 rounded-full flex items-center justify-center">
                              <Check className="h-2 w-2" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Add images above first</p>
                )}
              </div>
            )}
          </div>
        )}

        {!hasMultipleVariants && (
          <div className="border rounded-xl overflow-hidden">
            <div className="p-4 bg-muted/30">
              <h3 className="font-medium">Product images</h3>
              <p className="text-sm text-muted-foreground">{variants[0]?.images.length || 0} images assigned</p>
            </div>
            <div className="p-4">
              {imageLibrary.length > 0 && variants[0] ? (
                <div className="flex flex-wrap gap-3">
                  {imageLibrary.map((url, imgIndex) => {
                    const isAssigned = variants[0].images.includes(url)
                    const assignedIndex = variants[0].images.indexOf(url)
                    return (
                      <button
                        key={imgIndex}
                        type="button"
                        onClick={() => onToggleImage(variants[0].id, url)}
                        className={cn(
                          "relative w-20 h-20 rounded-lg overflow-hidden transition-all",
                          isAssigned ? "ring-2 ring-primary ring-offset-2" : "opacity-40 hover:opacity-100"
                        )}
                      >
                        <img src={url} alt="" className="object-cover w-full h-full" />
                        {isAssigned && assignedIndex === 0 && (
                          <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">Main</div>
                        )}
                        {isAssigned && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Add images above first</p>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export function OptionsSection({
  options,
  setOptions,
  newOptionTitle,
  setNewOptionTitle,
  newValueInputs,
  setNewValueInputs,
  selectedValues,
  setSelectedValues,
  lastClickedValue,
  setLastClickedValue,
  onUploadValueImage,
  activeValueImageUpload,
}: {
  options: OptionInput[]
  setOptions: React.Dispatch<React.SetStateAction<OptionInput[]>>
  newOptionTitle: string
  setNewOptionTitle: (v: string) => void
  newValueInputs: Record<number, { value: string; colorHex: string }>
  setNewValueInputs: React.Dispatch<React.SetStateAction<Record<number, { value: string; colorHex: string }>>>
  selectedValues: Record<number, Set<number>>
  setSelectedValues: React.Dispatch<React.SetStateAction<Record<number, Set<number>>>>
  lastClickedValue: { optionIndex: number; valueIndex: number } | null
  setLastClickedValue: React.Dispatch<React.SetStateAction<{ optionIndex: number; valueIndex: number } | null>>
  onUploadValueImage: (optionIndex: number, valueIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void
  activeValueImageUpload: { optionIndex: number; valueIndex: number } | null
}) {
  const handleAddOption = () => {
    if (newOptionTitle.trim()) {
      setOptions([...options, { title: newOptionTitle.trim(), values: [] }])
      setNewOptionTitle('')
    }
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleAddOptionValue = (optionIndex: number) => {
    const input = newValueInputs[optionIndex]
    const value = input?.value?.trim()
    if (value) {
      const newOptions = [...options]
      const option = newOptions[optionIndex]
      if (!option.values.some(v => v.value === value)) {
        const newValue: OptionValueInput = { 
          value,
          colorHex: option.isColor ? (input.colorHex || undefined) : undefined,
        }
        option.values.push(newValue)
        setOptions(newOptions)
      }
      setNewValueInputs({ ...newValueInputs, [optionIndex]: { value: '', colorHex: '' } })
    }
  }

  const handleValueClick = (optionIndex: number, valueIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
    
    setSelectedValues(prev => {
      const optionSelection = new Set(prev[optionIndex] || [])
      
      if (e.shiftKey && lastClickedValue?.optionIndex === optionIndex) {
        const start = Math.min(lastClickedValue.valueIndex, valueIndex)
        const end = Math.max(lastClickedValue.valueIndex, valueIndex)
        for (let i = start; i <= end; i++) {
          optionSelection.add(i)
        }
      } else if (e.metaKey || e.ctrlKey) {
        if (optionSelection.has(valueIndex)) {
          optionSelection.delete(valueIndex)
        } else {
          optionSelection.add(valueIndex)
        }
      } else {
        if (optionSelection.has(valueIndex) && optionSelection.size === 1) {
          optionSelection.clear()
        } else {
          optionSelection.clear()
          optionSelection.add(valueIndex)
        }
      }
      
      return { ...prev, [optionIndex]: optionSelection }
    })
    
    setLastClickedValue({ optionIndex, valueIndex })
  }

  const handleDeleteSelectedValues = (optionIndex: number) => {
    const selection = selectedValues[optionIndex]
    if (!selection || selection.size === 0) return
    
    const newOptions = [...options]
    newOptions[optionIndex].values = newOptions[optionIndex].values.filter((_, i) => !selection.has(i))
    setOptions(newOptions)
    setSelectedValues(prev => ({ ...prev, [optionIndex]: new Set() }))
  }

  const handleSelectAllValues = (optionIndex: number) => {
    const allIndices = new Set(options[optionIndex].values.map((_, i) => i))
    setSelectedValues(prev => ({ ...prev, [optionIndex]: allIndices }))
  }

  const handleClearSelection = (optionIndex: number) => {
    setSelectedValues(prev => ({ ...prev, [optionIndex]: new Set() }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Does this product have options?</h2>
        <p className="text-muted-foreground">
          Add options like Size or Color if your product comes in different variants. 
          Skip this step for simple products.
        </p>
      </div>

      {options.length > 0 && (
        <div className="space-y-4">
          {options.map((option, optionIndex) => (
            <div key={optionIndex} className="border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-muted/30">
                <span className="font-semibold text-lg">{option.title}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={option.isColor || false}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[optionIndex] = { ...option, isColor: e.target.checked }
                        if (!e.target.checked) {
                          newOptions[optionIndex].values = option.values.map(v => ({ ...v, colorHex: undefined }))
                        }
                        setOptions(newOptions)
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-muted-foreground">Color option</span>
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveOption(optionIndex)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {option.values.length > 0 && (
                  <div>
                    {(selectedValues[optionIndex]?.size || 0) > 0 && (
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <span className="text-muted-foreground">
                          {selectedValues[optionIndex]?.size} selected
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectAllValues(optionIndex)}
                          className="h-7 text-xs"
                        >
                          Select all
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearSelection(optionIndex)}
                          className="h-7 text-xs"
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSelectedValues(optionIndex)}
                          className="h-7 text-xs"
                        >
                          Delete selected
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mb-2">
                      Click to select, Shift+click for range, {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+click to add
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((v, valueIndex) => {
                        const isSelected = selectedValues[optionIndex]?.has(valueIndex) || false
                        return (
                          <button
                            key={valueIndex}
                            type="button"
                            onClick={(e) => handleValueClick(optionIndex, valueIndex, e)}
                            className={cn(
                              "group flex items-center gap-2 rounded-full px-4 py-2 transition-all cursor-pointer select-none",
                              isSelected 
                                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                                : "bg-muted hover:bg-muted/80"
                            )}
                          >
                            {v.colorHex && (
                              <div 
                                className={cn("w-5 h-5 rounded-full border", isSelected && "border-primary-foreground")}
                                style={{ backgroundColor: v.colorHex }}
                              />
                            )}
                            {v.imageUrl && (
                              <img src={v.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <span className="font-medium">{v.value}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Value name</Label>
                    <Input
                      value={newValueInputs[optionIndex]?.value || ''}
                      onChange={(e) => setNewValueInputs({ 
                        ...newValueInputs, 
                        [optionIndex]: { ...newValueInputs[optionIndex], value: e.target.value, colorHex: newValueInputs[optionIndex]?.colorHex || '' } 
                      })}
                      placeholder={`e.g., ${option.title === 'Size' ? 'Medium' : option.isColor ? 'Navy Blue' : 'Option value'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddOptionValue(optionIndex)
                        }
                      }}
                    />
                  </div>
                  {option.isColor && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Color</Label>
                      <input
                        type="color"
                        value={newValueInputs[optionIndex]?.colorHex || '#6366f1'}
                        onChange={(e) => setNewValueInputs({ 
                          ...newValueInputs, 
                          [optionIndex]: { ...newValueInputs[optionIndex], value: newValueInputs[optionIndex]?.value || '', colorHex: e.target.value } 
                        })}
                        className="w-10 h-10 rounded cursor-pointer border p-0.5 block"
                      />
                    </div>
                  )}
                  <Button type="button" onClick={() => handleAddOptionValue(optionIndex)} disabled={!newValueInputs[optionIndex]?.value?.trim()}>
                    Add
                  </Button>
                </div>

                {option.values.length > 0 && (
                  <div className="pt-3 border-t">
                    <Label className="text-xs text-muted-foreground mb-2 block">Optional: attach images to values</Label>
                    <div className="flex flex-wrap gap-3">
                      {option.values.map((v, valueIndex) => (
                        <label key={valueIndex} className="cursor-pointer text-center">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onUploadValueImage(optionIndex, valueIndex, e)}
                          />
                          <div className={cn(
                            "w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors",
                            v.imageUrl ? "border-solid border-primary" : "hover:border-primary"
                          )}>
                            {activeValueImageUpload?.optionIndex === optionIndex && activeValueImageUpload?.valueIndex === valueIndex ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : v.imageUrl ? (
                              <img src={v.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1 block">{v.value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Input
          value={newOptionTitle}
          onChange={(e) => setNewOptionTitle(e.target.value)}
          placeholder="Option name (e.g., Size, Color, Material)"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddOption()
            }
          }}
        />
        <Button type="button" onClick={handleAddOption} disabled={!newOptionTitle.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      {options.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground mb-1">No options yet</p>
          <p className="text-sm text-muted-foreground">Your product will have a single variant</p>
        </div>
      )}
    </div>
  )
}

export function PricingSection({
  variants,
  setVariants,
  hasMultipleVariants,
  bulkPrice,
  setBulkPrice,
  bulkCurrency,
  setBulkCurrency,
}: {
  variants: VariantInput[]
  setVariants: React.Dispatch<React.SetStateAction<VariantInput[]>>
  hasMultipleVariants: boolean
  bulkPrice: string
  setBulkPrice: (v: string) => void
  bulkCurrency: string
  setBulkCurrency: (v: string) => void
}) {
  const applyBulkPrice = () => {
    if (bulkPrice) {
      setVariants(variants.map(v => ({ ...v, price: bulkPrice, currency: bulkCurrency })))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Set your prices</h2>
        <p className="text-muted-foreground">
          {hasMultipleVariants 
            ? `You have ${variants.length} variants. Set a price for each one.`
            : 'How much does your product cost?'
          }
        </p>
      </div>

      {hasMultipleVariants && (
        <div className="flex gap-3 items-end p-4 bg-muted/50 rounded-xl">
          <div className="flex-1">
            <Label className="text-sm">Set all prices at once</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                step="0.01"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Price"
                className="flex-1"
              />
              <Select value={bulkCurrency} onValueChange={setBulkCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                  <SelectItem value="cad">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="button" onClick={applyBulkPrice} disabled={!bulkPrice}>
            Apply to all
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {variants.map((variant) => (
          <div key={variant.id} className="flex items-center gap-4 p-4 border rounded-xl">
            <div className="flex-1">
              <p className="font-medium">{variant.title}</p>
              {variant.sku && <p className="text-sm text-muted-foreground">SKU: {variant.sku}</p>}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                step="0.01"
                value={variant.price}
                onChange={(e) => setVariants(variants.map(v => 
                  v.id === variant.id ? { ...v, price: e.target.value } : v
                ))}
                placeholder="0.00"
                className="w-28"
              />
              <Select 
                value={variant.currency} 
                onValueChange={(val) => setVariants(variants.map(v => 
                  v.id === variant.id ? { ...v, currency: val } : v
                ))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                  <SelectItem value="cad">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
