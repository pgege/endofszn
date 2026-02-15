import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { cn } from '@/lib/utils'
import { CategoryAutocomplete, CategoryOption } from './category-autocomplete'

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

        {setSelectedCategoryIds && (
          <div className="space-y-2">
            <Label className="text-base">Categories</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select one or more leaf categories for this product
            </p>
            <CategoryAutocomplete
              categories={categories}
              selectedIds={selectedCategoryIds}
              onChange={setSelectedCategoryIds}
              placeholder="Search and select categories..."
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-base">Visibility</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus('draft')}
              className={cn(
                "flex-1 p-4 border-2 text-left transition-colors",
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
                "flex-1 p-4 border-2 text-left transition-colors",
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
