import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ImageGallery } from './image-gallery'
import { CollapsibleDescription } from './collapsible-description'
import { CollapsibleSection } from './collapsible-section'
import { OptionSelector } from './option-selector'
import type { OptionInput, VariantInput, SectionInput } from './product-form-types'

export function FullPagePreview({
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
    </div>
  )
}
