import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useStoreId } from '../../store-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { paths } from '@/config/paths'
import type { Category, CreateCategoryInput } from '@/lib/api/categories'

interface CategoryFormProps {
  formData: CreateCategoryInput
  setFormData: (fn: (f: CreateCategoryInput) => CreateCategoryInput) => void
  categories: Category[]
  excludeId?: string
}

function CategoryForm({ formData, setFormData, categories, excludeId }: CategoryFormProps) {
  const filteredCategories = excludeId ? categories.filter(cat => cat.id !== excludeId) : categories
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="cat-name">Name</Label>
        <Input id="cat-name" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Shoes, Electronics" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-description">Description</Label>
        <Input id="cat-description" value={formData.description || ''} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-parent">Parent Category</Label>
        <Select value={formData.parent_category_id || 'none'} onValueChange={(v) => setFormData(f => ({ ...f, parent_category_id: v === 'none' ? undefined : v }))}>
          <SelectTrigger><SelectValue placeholder="No parent (top-level)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No parent (top-level)</SelectItem>
            {filteredCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.parent_category ? `${cat.parent_category.name} > ` : ''}{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="cat-active">Active</Label>
        <Switch id="cat-active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(f => ({ ...f, is_active: checked }))} />
      </div>
    </div>
  )
}

export function CreateCategoryDialog({
  open, onOpenChange, formData, setFormData, categories, isPending, onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CreateCategoryInput
  setFormData: (fn: (f: CreateCategoryInput) => CreateCategoryInput) => void
  categories: Category[]
  isPending: boolean
  onCreate: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); onCreate() }}>
          <DialogHeader><DialogTitle>Create Category</DialogTitle></DialogHeader>
          <CategoryForm formData={formData} setFormData={setFormData} categories={categories} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EditCategoryDialog({
  category, formData, setFormData, categories, isPending, onUpdate, onClose,
}: {
  category: Category | null
  formData: CreateCategoryInput
  setFormData: (fn: (f: CreateCategoryInput) => CreateCategoryInput) => void
  categories: Category[]
  isPending: boolean
  onUpdate: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={!!category} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); onUpdate() }}>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          <CategoryForm formData={formData} setFormData={setFormData} categories={categories} excludeId={category?.id} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteCategoryDialog({
  category, onClose, onDelete,
}: {
  category: Category | null
  onClose: () => void
  onDelete: () => void
}) {
  return (
    <AlertDialog open={!!category} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{category?.name}"?
            {category?.category_children && category.category_children.length > 0 && (
              <span className="block mt-2 text-destructive">This category has subcategories that will also be affected.</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function TemplateDialog({
  open, onOpenChange, templates, selectedTemplate, setSelectedTemplate, isPending, onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: Array<{ id: string; name: string; description: string }>
  selectedTemplate: string
  setSelectedTemplate: (id: string) => void
  isPending: boolean
  onApply: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>Start with a pre-built category structure. You can customize it after.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={cn('border p-4 cursor-pointer transition-colors', selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50')}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn('w-4 h-4 border-2', selectedTemplate === template.id ? 'border-primary bg-primary' : 'border-muted-foreground/50')} />
                <div>
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onApply} disabled={!selectedTemplate || isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function LeafToBranchDialog({
  open, onOpenChange, products,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: string[]
}) {
  const storeId = useStoreId()
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Products Need Reassignment</AlertDialogTitle>
          <AlertDialogDescription>
            The parent category has products assigned to it. Before adding subcategories, you need to move these products to another category:
            <ul className="mt-3 space-y-1">
              {products.slice(0, 5).map((title, i) => <li key={i} className="text-sm">• {title}</li>)}
              {products.length > 5 && <li className="text-sm text-muted-foreground">...and {products.length - 5} more</li>}
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Got it</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link to={paths.app.stores.products.list.getHref(storeId)}>Go to Products</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
