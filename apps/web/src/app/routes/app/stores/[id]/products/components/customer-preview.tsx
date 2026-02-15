import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageGallery } from './image-gallery'
import { CollapsibleDescription } from './collapsible-description'
import { CollapsibleSection } from './collapsible-section'
import { OptionSelector } from './option-selector'
import type { OptionInput, VariantInput, SectionInput } from './product-form-types'

export function CustomerPreview({
  title,
  description,
  options,
  selectedVariant,
  onSelectOption,
  sections = [],
}: {
  title: string
  description: string
  options: OptionInput[]
  selectedVariant: VariantInput | null
  onSelectOption: (optionTitle: string, value: string) => void
  sections?: SectionInput[]
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const displayImages = selectedVariant?.images || []
  const displayPrice = selectedVariant?.price

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [selectedVariant?.id])

  return (
    <div className="bg-background border p-4 space-y-4">
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

      {sections.length > 0 && (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <CollapsibleSection key={index} title={section.name} content={section.content} />
          ))}
        </div>
      )}

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
