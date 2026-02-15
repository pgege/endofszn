import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { OptionInput } from './product-form-types'

export function OptionSelector({
  options,
  selectedValues,
  onSelect,
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
                        "w-9 h-9 border-2 transition-all",
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
                        "w-14 h-14 border-2 overflow-hidden transition-all",
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
                      "px-4 py-2 border text-sm font-medium transition-colors",
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
