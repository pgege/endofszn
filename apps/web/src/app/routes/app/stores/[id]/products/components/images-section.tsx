import { useState, useEffect, useMemo } from 'react'
import { X, Upload, Loader2, Check, ImageIcon, Search, Filter } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { OptionInput, VariantInput } from './product-form-types'

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
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const toggleVariantSelection = (id: string) => {
    setSelectedVariantIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAssignImages = () => {
    if (selectedImages.size === 0 || selectedVariantIds.size === 0) return
    const imagesToAdd = Array.from(selectedImages)
    setVariants(prev => prev.map(v => {
      if (selectedVariantIds.has(v.id)) {
        return { ...v, images: [...new Set([...v.images, ...imagesToAdd])] }
      }
      return v
    }))
    setSelectedImages(new Set())
    setSelectedVariantIds(new Set())
    setShowVariantPicker(false)
    setVariantSearch('')
    setVariantFilter({})
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
      const sortedKeys = [...keys].sort((a, b) => (valuesByKey[a]?.size ?? 0) - (valuesByKey[b]?.size ?? 0))
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
    for (const key of optionKeys) valuesByKey[key] = new Set()
    for (const variant of variants) {
      for (const key of optionKeys) {
        if (variant.optionValues[key]) valuesByKey[key].add(variant.optionValues[key])
      }
    }
    const sortedKeys = [...optionKeys].sort((a, b) => (valuesByKey[a]?.size ?? 0) - (valuesByKey[b]?.size ?? 0))
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

  const configuredCount = useMemo(() => variants.filter(v => v.images.length > 0).length, [variants])

  const filteredVariants = useMemo(() => {
    let result = variants
    if (variantSearch.trim()) {
      const search = variantSearch.toLowerCase()
      result = result.filter(v => v.title.toLowerCase().includes(search))
    }
    for (const [key, value] of Object.entries(variantFilter)) {
      if (value) {
        result = result.filter(v => {
          if (v.optionValues[key]) return v.optionValues[key] === value
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
          <p className="text-muted-foreground">Upload images, select them, then assign to variants.</p>
        </div>

        <ImageLibraryPanel
          imageLibrary={imageLibrary}
          selectedImages={selectedImages}
          hasMultipleVariants={hasMultipleVariants}
          uploadingVariantId={uploadingVariantId}
          onToggleSelection={toggleImageSelection}
          onClearSelection={() => setSelectedImages(new Set())}
          onSelectAll={() => setSelectedImages(new Set(imageLibrary))}
          onOpenVariantPicker={() => setShowVariantPicker(true)}
          onLibraryUpload={onLibraryUpload}
          onDeleteImage={(index, url) => {
            setImageLibrary(prev => prev.filter((_, i) => i !== index))
            setVariants(prev => prev.map(v => ({ ...v, images: v.images.filter(img => img !== url) })))
            setSelectedImages(prev => { const next = new Set(prev); next.delete(url); return next })
          }}
        />

        <VariantPickerDialog
          open={showVariantPicker}
          onOpenChange={(open) => {
            setShowVariantPicker(open)
            if (!open) { setSelectedVariantIds(new Set()); setVariantSearch(''); setVariantFilter({}) }
          }}
          selectedImages={selectedImages}
          selectedVariantIds={selectedVariantIds}
          filteredVariants={filteredVariants}
          optionStructure={optionStructure}
          variantSearch={variantSearch}
          variantFilter={variantFilter}
          onSearchChange={setVariantSearch}
          onFilterChange={setVariantFilter}
          onToggleVariant={toggleVariantSelection}
          onSelectAll={() => setSelectedVariantIds(new Set(filteredVariants.map(v => v.id)))}
          onClearSelection={() => setSelectedVariantIds(new Set())}
          onAssign={handleAssignImages}
          onAssignToAll={() => {
            onApplyToAll(Array.from(selectedImages))
            setSelectedImages(new Set())
            setShowVariantPicker(false)
          }}
        />

        {hasMultipleVariants && (
          <SingleVariantEditor
            variants={variants}
            imageLibrary={imageLibrary}
            optionStructure={optionStructure}
            selectedOptions={selectedOptions}
            selectedVariant={selectedVariant}
            configuredCount={configuredCount}
            onSelectOption={(key, val) => setSelectedOptions(prev => ({ ...prev, [key]: val }))}
            onToggleImage={onToggleImage}
            onClearVariantImages={(variantId) => setVariants(prev => prev.map(v => v.id === variantId ? { ...v, images: [] } : v))}
          />
        )}

        {!hasMultipleVariants && (
          <SingleProductImages
            variant={variants[0]}
            imageLibrary={imageLibrary}
            onToggleImage={onToggleImage}
          />
        )}
      </div>
    </TooltipProvider>
  )
}

function ImageLibraryPanel({
  imageLibrary, selectedImages, hasMultipleVariants, uploadingVariantId,
  onToggleSelection, onClearSelection, onSelectAll, onOpenVariantPicker,
  onLibraryUpload, onDeleteImage,
}: {
  imageLibrary: string[]
  selectedImages: Set<string>
  hasMultipleVariants: boolean
  uploadingVariantId: string | null
  onToggleSelection: (url: string) => void
  onClearSelection: () => void
  onSelectAll: () => void
  onOpenVariantPicker: () => void
  onLibraryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDeleteImage: (index: number, url: string) => void
}) {
  return (
    <div className="border overflow-hidden">
      <div className="p-4 bg-muted/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-medium">Image Library</span>
          <span className="text-sm text-muted-foreground">
            {selectedImages.size > 0 ? `${selectedImages.size} selected` : `${imageLibrary.length} images`}
          </span>
          {selectedImages.size > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>Clear</Button>
          )}
          {imageLibrary.length > 0 && selectedImages.size < imageLibrary.length && (
            <Button type="button" variant="ghost" size="sm" onClick={onSelectAll}>Select all</Button>
          )}
        </div>
        {hasMultipleVariants && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button type="button" disabled={selectedImages.size === 0} onClick={onOpenVariantPicker} className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Assign to Variants
                </Button>
              </span>
            </TooltipTrigger>
            {selectedImages.size === 0 && (
              <TooltipContent><p>Select images first by clicking on them</p></TooltipContent>
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
                onClick={() => onToggleSelection(url)}
                className={cn(
                  "relative w-20 h-20 overflow-hidden transition-all group",
                  isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:ring-2 hover:ring-muted-foreground hover:ring-offset-2"
                )}
              >
                <img src={url} alt="" className="object-cover w-full h-full" />
                <div className={cn(
                  "absolute top-1 right-1 w-5 h-5 flex items-center justify-center transition-all",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-black/50 opacity-0 group-hover:opacity-100"
                )}>
                  <Check className="h-3 w-3" />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute bottom-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onDeleteImage(index, url) }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </button>
            )
          })}
          <label className="w-20 h-20 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
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
  )
}

function VariantPickerDialog({
  open, onOpenChange, selectedImages, selectedVariantIds, filteredVariants,
  optionStructure, variantSearch, variantFilter,
  onSearchChange, onFilterChange, onToggleVariant, onSelectAll, onClearSelection,
  onAssign, onAssignToAll,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedImages: Set<string>
  selectedVariantIds: Set<string>
  filteredVariants: VariantInput[]
  optionStructure: { keys: string[]; valuesByKey: Record<string, string[]> }
  variantSearch: string
  variantFilter: Record<string, string>
  onSearchChange: (v: string) => void
  onFilterChange: (v: Record<string, string>) => void
  onToggleVariant: (id: string) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onAssign: () => void
  onAssignToAll: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from(selectedImages).slice(0, 4).map((url, i) => (
                <div key={i} className="w-8 h-8 overflow-hidden border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {selectedImages.size > 4 && (
                <div className="w-8 h-8 bg-muted flex items-center justify-center text-xs">+{selectedImages.size - 4}</div>
              )}
            </div>
            <span>Assign {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={variantSearch} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search variants..." className="pl-9" />
          </div>
          {optionStructure.keys.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {optionStructure.keys.map((key) => (
                <Select key={key} value={variantFilter[key] || 'all'} onValueChange={(val) => onFilterChange({ ...variantFilter, [key]: val === 'all' ? '' : val })}>
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
              <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>Select all ({filteredVariants.length})</Button>
              <Button type="button" variant="outline" size="sm" onClick={onClearSelection}>Clear</Button>
            </div>
            <span className="text-sm text-muted-foreground">{selectedVariantIds.size} selected</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto border divide-y min-h-[200px] max-h-[300px]">
          {filteredVariants.length > 0 ? filteredVariants.map((variant) => {
            const isSelected = selectedVariantIds.has(variant.id)
            return (
              <button key={variant.id} type="button" onClick={() => onToggleVariant(variant.id)}
                className={cn("w-full p-3 flex items-center gap-3 text-left transition-colors", isSelected ? "bg-primary/10" : "hover:bg-muted/50")}
              >
                <div className={cn("w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <div className="flex gap-1 shrink-0">
                  {variant.images.slice(0, 2).map((img, i) => (
                    <div key={i} className="w-8 h-8 overflow-hidden bg-muted"><img src={img} alt="" className="w-full h-full object-cover" /></div>
                  ))}
                  {variant.images.length === 0 && (
                    <div className="w-8 h-8 bg-muted flex items-center justify-center"><ImageIcon className="w-3 h-3 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{variant.title}</p>
                  <p className="text-xs text-muted-foreground">{variant.images.length} images</p>
                </div>
              </button>
            )
          }) : (
            <div className="p-8 text-center text-muted-foreground"><p>No variants match your filters</p></div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onAssignToAll}>All variants</Button>
          <Button type="button" className="flex-1" disabled={selectedVariantIds.size === 0} onClick={onAssign}>
            Assign to {selectedVariantIds.size || '...'} selected
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SingleVariantEditor({
  variants, imageLibrary, optionStructure, selectedOptions, selectedVariant, configuredCount,
  onSelectOption, onToggleImage, onClearVariantImages,
}: {
  variants: VariantInput[]
  imageLibrary: string[]
  optionStructure: { keys: string[]; valuesByKey: Record<string, string[]> }
  selectedOptions: Record<string, string>
  selectedVariant: VariantInput | undefined
  configuredCount: number
  onSelectOption: (key: string, val: string) => void
  onToggleImage: (variantId: string, imageUrl: string) => void
  onClearVariantImages: (variantId: string) => void
}) {
  return (
    <div className="border overflow-hidden">
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
                      <button key={value} type="button" onClick={() => onSelectOption(optionKey, value)}
                        className={cn("px-3 py-1.5 text-sm font-medium transition-all", currentValue === value ? "bg-primary text-primary-foreground" : "bg-background border hover:border-primary")}
                      >{value}</button>
                    ))}
                  </div>
                ) : (
                  <Select value={currentValue} onValueChange={(val) => onSelectOption(optionKey, val)}>
                    <SelectTrigger className="w-full bg-background"><SelectValue placeholder={`Select ${optionKey}`} /></SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      {values.map((value) => (<SelectItem key={value} value={value}>{value}</SelectItem>))}
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
              <Button type="button" variant="ghost" size="sm" onClick={() => onClearVariantImages(selectedVariant.id)}>Clear</Button>
            )}
          </div>
          {imageLibrary.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {imageLibrary.map((url, imgIndex) => {
                const isAssigned = selectedVariant.images.includes(url)
                const assignedIndex = selectedVariant.images.indexOf(url)
                return (
                  <button key={imgIndex} type="button" onClick={() => onToggleImage(selectedVariant.id, url)}
                    className={cn("relative w-14 h-14 overflow-hidden transition-all", isAssigned ? "ring-2 ring-primary ring-offset-1" : "opacity-40 hover:opacity-100")}
                  >
                    <img src={url} alt="" className="object-cover w-full h-full" />
                    {isAssigned && assignedIndex === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] text-center">Main</div>
                    )}
                    {isAssigned && (
                      <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground w-3.5 h-3.5 flex items-center justify-center">
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
  )
}

function SingleProductImages({
  variant, imageLibrary, onToggleImage,
}: {
  variant: VariantInput | undefined
  imageLibrary: string[]
  onToggleImage: (variantId: string, imageUrl: string) => void
}) {
  if (!variant) return null
  return (
    <div className="border overflow-hidden">
      <div className="p-4 bg-muted/30">
        <h3 className="font-medium">Product images</h3>
        <p className="text-sm text-muted-foreground">{variant.images.length} images assigned</p>
      </div>
      <div className="p-4">
        {imageLibrary.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {imageLibrary.map((url, imgIndex) => {
              const isAssigned = variant.images.includes(url)
              const assignedIndex = variant.images.indexOf(url)
              return (
                <button key={imgIndex} type="button" onClick={() => onToggleImage(variant.id, url)}
                  className={cn("relative w-20 h-20 overflow-hidden transition-all", isAssigned ? "ring-2 ring-primary ring-offset-2" : "opacity-40 hover:opacity-100")}
                >
                  <img src={url} alt="" className="object-cover w-full h-full" />
                  {isAssigned && assignedIndex === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">Main</div>
                  )}
                  {isAssigned && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center">
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
  )
}
