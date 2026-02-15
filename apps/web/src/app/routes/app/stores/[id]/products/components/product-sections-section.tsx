import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import type { SectionInput } from './product-form-types'

export function ProductSectionsSection({
  sections,
  setSections,
}: {
  sections: SectionInput[]
  setSections: React.Dispatch<React.SetStateAction<SectionInput[]>>
}) {
  const [newSectionName, setNewSectionName] = useState('')

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      setSections([...sections, { name: newSectionName.trim(), content: '' }])
      setNewSectionName('')
    }
  }

  const handleUpdateSection = (index: number, content: string) => {
    const newSections = [...sections]
    newSections[index].content = content
    setSections(newSections)
  }

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Product Information Sections</h2>
        <p className="text-muted-foreground">
          Add custom information sections like Fabric & Care, Size Guide, License info, etc.
        </p>
      </div>

      {sections.length > 0 && (
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{section.name}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSection(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <RichTextEditor
                value={section.content}
                onChange={(content) => handleUpdateSection(index, content)}
                placeholder={`Enter ${section.name.toLowerCase()} information...`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Input
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          placeholder="Section name (e.g., Fabric & Care, Size Guide)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddSection()
            }
          }}
        />
        <Button
          type="button"
          onClick={handleAddSection}
          disabled={!newSectionName.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 && (
        <div className="border-2 border-dashed p-8 text-center text-muted-foreground">
          <p>No custom sections yet</p>
          <p className="text-sm mt-1">Add sections like Fabric & Care, Size Guide, License info, etc.</p>
        </div>
      )}
    </div>
  )
}
