import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, FolderTree, ChevronRight, Pencil, Trash2 } from 'lucide-react'
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
import { useStore } from '@/lib/api/auth'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  Category,
  CreateCategoryInput,
} from '@/lib/api/categories'
import { paths } from '@/config/paths'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function CategoriesPage() {
  const { id: storeId } = useParams<{ id: string }>()
  const { data: store, isLoading: storeLoading, error: storeError } = useStore(storeId!)
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories(storeId!)
  const createCategory = useCreateCategory(storeId!)
  const updateCategory = useUpdateCategory(storeId!)
  const deleteCategory = useDeleteCategory(storeId!)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    description: '',
    parent_category_id: undefined,
    is_active: true,
  })

  const rootCategories = useMemo(() => {
    return categories.filter(c => !c.parent_category)
  }, [categories])

  const categoryTree = useMemo(() => {
    const buildTree = (parentId: string | null): Category[] => {
      return categories
        .filter(c => (parentId ? c.parent_category?.id === parentId : !c.parent_category))
        .sort((a, b) => a.rank - b.rank)
    }
    return buildTree
  }, [categories])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_category_id: undefined,
      is_active: true,
    })
  }

  const openCreateDialog = (parentId?: string) => {
    resetForm()
    if (parentId) {
      setFormData(f => ({ ...f, parent_category_id: parentId }))
    }
    setShowCreateDialog(true)
  }

  const openEditDialog = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_category_id: category.parent_category?.id,
      is_active: category.is_active,
    })
    setEditingCategory(category)
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }
    try {
      await createCategory.mutateAsync(formData)
      toast.success('Category created')
      setShowCreateDialog(false)
      resetForm()
    } catch (err: any) {
      toast.error('Failed to create category', { description: err.message })
    }
  }

  const handleUpdate = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error('Category name is required')
      return
    }
    try {
      await updateCategory.mutateAsync({
        categoryId: editingCategory.id,
        ...formData,
      })
      toast.success('Category updated')
      setEditingCategory(null)
      resetForm()
    } catch (err: any) {
      toast.error('Failed to update category', { description: err.message })
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    try {
      await deleteCategory.mutateAsync(deletingCategory.id)
      toast.success('Category deleted')
      setDeletingCategory(null)
    } catch (err: any) {
      toast.error('Failed to delete category', { description: err.message })
    }
  }

  const isLoading = storeLoading || categoriesLoading
  const queryError = storeError || categoriesError

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  if (queryError || !store) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {storeError ? 'Store not found' : 'Failed to load categories'}
          </h2>
          <p className="text-muted-foreground">
            {queryError?.message || 'Something went wrong'}
          </p>
        </div>
      </div>
    )
  }

  const CategoryItem = ({ category, depth = 0 }: { category: Category; depth?: number }) => {
    const children = categoryTree(category.id)
    const hasChildren = children.length > 0

    return (
      <div>
        <div
          className={cn(
            'flex items-center gap-3 py-3 px-4 hover:bg-muted/50 rounded-lg group',
            depth > 0 && 'ml-6 border-l-2 border-muted'
          )}
          style={{ paddingLeft: depth > 0 ? `${depth * 24 + 16}px` : undefined }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            {!hasChildren && <div className="w-4" />}
            <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{category.name}</span>
            {!category.is_active && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openCreateDialog(category.id)}
              title="Add subcategory"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingCategory(category)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {hasChildren && (
          <div>
            {children.map(child => (
              <CategoryItem key={child.id} category={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={paths.app.stores.detail.getHref(storeId!)}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Categories</h1>
              <p className="text-muted-foreground">{store.name}</p>
            </div>
          </div>
          <Button onClick={() => openCreateDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-4">
              Create categories to organize your products
            </p>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first category
            </Button>
          </div>
        ) : (
          <div className="border rounded-xl divide-y">
            {rootCategories.map(category => (
              <CategoryItem key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Shoes, Electronics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={formData.parent_category_id || 'none'}
                onValueChange={(v) => setFormData(f => ({ ...f, parent_category_id: v === 'none' ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.parent_category ? `${cat.parent_category.name} > ` : ''}{cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(f => ({ ...f, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createCategory.isPending}>
              {createCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description || ''}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parent">Parent Category</Label>
              <Select
                value={formData.parent_category_id || 'none'}
                onValueChange={(v) => setFormData(f => ({ ...f, parent_category_id: v === 'none' ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {categories
                    .filter(cat => cat.id !== editingCategory?.id)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.parent_category ? `${cat.parent_category.name} > ` : ''}{cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-is_active">Active</Label>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(f => ({ ...f, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
              {updateCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? 
              {deletingCategory?.category_children && deletingCategory.category_children.length > 0 && (
                <span className="block mt-2 text-destructive">
                  This category has subcategories that will also be affected.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
