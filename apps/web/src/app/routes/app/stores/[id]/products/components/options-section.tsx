import { Plus, X, Loader2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { OptionInput, OptionValueInput } from './product-form-types'

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
        for (let i = start; i <= end; i++) optionSelection.add(i)
      } else if (e.metaKey || e.ctrlKey) {
        if (optionSelection.has(valueIndex)) optionSelection.delete(valueIndex)
        else optionSelection.add(valueIndex)
      } else {
        if (optionSelection.has(valueIndex) && optionSelection.size === 1) optionSelection.clear()
        else { optionSelection.clear(); optionSelection.add(valueIndex) }
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
            <OptionCard
              key={optionIndex}
              option={option}
              optionIndex={optionIndex}
              selectedValues={selectedValues}
              newValueInputs={newValueInputs}
              activeValueImageUpload={activeValueImageUpload}
              onRemoveOption={handleRemoveOption}
              onToggleColor={(checked) => {
                const newOptions = [...options]
                newOptions[optionIndex] = { ...option, isColor: checked }
                if (!checked) {
                  newOptions[optionIndex].values = option.values.map(v => ({ ...v, colorHex: undefined }))
                }
                setOptions(newOptions)
              }}
              onValueClick={handleValueClick}
              onSelectAll={handleSelectAllValues}
              onClearSelection={handleClearSelection}
              onDeleteSelected={handleDeleteSelectedValues}
              onAddValue={handleAddOptionValue}
              onValueInputChange={(value) => setNewValueInputs({
                ...newValueInputs,
                [optionIndex]: { ...newValueInputs[optionIndex], value, colorHex: newValueInputs[optionIndex]?.colorHex || '' }
              })}
              onColorChange={(colorHex) => setNewValueInputs({
                ...newValueInputs,
                [optionIndex]: { ...newValueInputs[optionIndex], value: newValueInputs[optionIndex]?.value || '', colorHex }
              })}
              onUploadValueImage={onUploadValueImage}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Input
          value={newOptionTitle}
          onChange={(e) => setNewOptionTitle(e.target.value)}
          placeholder="Option name (e.g., Size, Color, Material)"
          className="flex-1"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption() } }}
        />
        <Button type="button" onClick={handleAddOption} disabled={!newOptionTitle.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      {options.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed">
          <p className="text-muted-foreground mb-1">No options yet</p>
          <p className="text-sm text-muted-foreground">Your product will have a single variant</p>
        </div>
      )}
    </div>
  )
}

function OptionCard({
  option, optionIndex, selectedValues, newValueInputs, activeValueImageUpload,
  onRemoveOption, onToggleColor, onValueClick, onSelectAll, onClearSelection,
  onDeleteSelected, onAddValue, onValueInputChange, onColorChange, onUploadValueImage,
}: {
  option: OptionInput
  optionIndex: number
  selectedValues: Record<number, Set<number>>
  newValueInputs: Record<number, { value: string; colorHex: string }>
  activeValueImageUpload: { optionIndex: number; valueIndex: number } | null
  onRemoveOption: (index: number) => void
  onToggleColor: (checked: boolean) => void
  onValueClick: (optionIndex: number, valueIndex: number, e: React.MouseEvent) => void
  onSelectAll: (optionIndex: number) => void
  onClearSelection: (optionIndex: number) => void
  onDeleteSelected: (optionIndex: number) => void
  onAddValue: (optionIndex: number) => void
  onValueInputChange: (value: string) => void
  onColorChange: (colorHex: string) => void
  onUploadValueImage: (optionIndex: number, valueIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="border overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-muted/30">
        <span className="font-semibold text-lg">{option.title}</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={option.isColor || false}
              onChange={(e) => onToggleColor(e.target.checked)}
              className="border-gray-300"
            />
            <span className="text-muted-foreground">Color option</span>
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveOption(optionIndex)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {option.values.length > 0 && (
          <div>
            {(selectedValues[optionIndex]?.size || 0) > 0 && (
              <div className="flex items-center gap-2 mb-3 text-sm">
                <span className="text-muted-foreground">{selectedValues[optionIndex]?.size} selected</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => onSelectAll(optionIndex)} className="h-7 text-xs">Select all</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onClearSelection(optionIndex)} className="h-7 text-xs">Clear</Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => onDeleteSelected(optionIndex)} className="h-7 text-xs">Delete selected</Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-2">
              Click to select, Shift+click for range, {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+click to add
            </p>
            <div className="flex flex-wrap gap-2">
              {option.values.map((v, valueIndex) => {
                const isSelected = selectedValues[optionIndex]?.has(valueIndex) || false
                return (
                  <button key={valueIndex} type="button" onClick={(e) => onValueClick(optionIndex, valueIndex, e)}
                    className={cn(
                      "group flex items-center gap-2 px-4 py-2 transition-all cursor-pointer select-none",
                      isSelected ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {v.colorHex && <div className={cn("w-5 h-5 border", isSelected && "border-primary-foreground")} style={{ backgroundColor: v.colorHex }} />}
                    {v.imageUrl && <img src={v.imageUrl} alt="" className="w-5 h-5 object-cover" />}
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
              onChange={(e) => onValueInputChange(e.target.value)}
              placeholder={`e.g., ${option.title === 'Size' ? 'Medium' : option.isColor ? 'Navy Blue' : 'Option value'}`}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddValue(optionIndex) } }}
            />
          </div>
          {option.isColor && (
            <div>
              <Label className="text-xs text-muted-foreground">Color</Label>
              <input
                type="color"
                value={newValueInputs[optionIndex]?.colorHex || '#6366f1'}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-10 h-10 cursor-pointer border p-0.5 block"
              />
            </div>
          )}
          <Button type="button" onClick={() => onAddValue(optionIndex)} disabled={!newValueInputs[optionIndex]?.value?.trim()}>Add</Button>
        </div>

        {option.values.length > 0 && (
          <div className="pt-3 border-t">
            <Label className="text-xs text-muted-foreground mb-2 block">Optional: attach images to values</Label>
            <div className="flex flex-wrap gap-3">
              {option.values.map((v, valueIndex) => (
                <label key={valueIndex} className="cursor-pointer text-center">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadValueImage(optionIndex, valueIndex, e)} />
                  <div className={cn(
                    "w-16 h-16 border-2 border-dashed flex items-center justify-center transition-colors",
                    v.imageUrl ? "border-solid border-primary" : "hover:border-primary"
                  )}>
                    {activeValueImageUpload?.optionIndex === optionIndex && activeValueImageUpload?.valueIndex === valueIndex ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : v.imageUrl ? (
                      <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
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
  )
}
