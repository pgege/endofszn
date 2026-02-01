import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, FolderTree, ChevronRight, ChevronDown, Pencil, Trash2, AlertTriangle, Sparkles, Package, FolderOpen, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useStore } from '@/lib/api/auth'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategoryTemplates,
  useApplyCategoryTemplate,
  useUncategorizedProducts,
  Category,
  CreateCategoryInput,
} from '@/lib/api/categories'
import { paths } from '@/config/paths'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BulkCategorizeModal } from './components/bulk-categorize-modal'

export default function CategoriesPage() {
  const { id: storeId } = useParams<{ id: string }>()
  const { data: store, isLoading: storeLoading, error: storeError } = useStore(storeId!)
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories(storeId!)
  const { data: templates = [] } = useCategoryTemplates(storeId!)
  const { data: uncategorizedData } = useUncategorizedProducts(storeId!)
  const createCategory = useCreateCategory(storeId!)
  const updateCategory = useUpdateCategory(storeId!)
  const deleteCategory = useDeleteCategory(storeId!)
  const applyTemplate = useApplyCategoryTemplate(storeId!)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showLeafToBranchDialog, setShowLeafToBranchDialog] = useState(false)
  const [showBulkCategorizeModal, setShowBulkCategorizeModal] = useState(false)
  const [leafToBranchProducts, setLeafToBranchProducts] = useState<string[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    description: '',
    parent_category_id: undefined,
    is_active: true,
  })

  const rootCategories = useMemo(() => {
    return categories.filter(c => !c.parent_category)
  }, [categories])

  const categoryTree = useCallback((parentId: string | null): Category[] => {
    return categories
      .filter(c => (parentId ? c.parent_category?.id === parentId : !c.parent_category))
      .sort((a, b) => a.rank - b.rank)
  }, [categories])

  const toggleExpand = (categoryId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = categories.filter(c => {
      const children = categoryTree(c.id)
      return children.length > 0
    }).map(c => c.id)
    setExpandedIds(new Set(allIds))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

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
      setExpandedIds(prev => new Set([...prev, parentId]))
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
      try {
        const errorData = JSON.parse(err.message)
        if (errorData.products_on_parent) {
          setLeafToBranchProducts(errorData.product_titles || [])
          setShowLeafToBranchDialog(true)
          setShowCreateDialog(false)
          return
        }
      } catch {
      }
      toast.error('Failed to create category', { description: err.message })
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template')
      return
    }
    try {
      const result = await applyTemplate.mutateAsync(selectedTemplate)
      toast.success(result.message)
      setShowTemplateDialog(false)
      setSelectedTemplate('')
      expandAll()
    } catch (err: any) {
      toast.error('Failed to apply template', { description: err.message })
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

  const TreeCategoryItem = ({ category, depth = 0 }: { category: Category; depth?: number }) => {
    const children = categoryTree(category.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedIds.has(category.id)
    const isLeaf = !hasChildren

    return (
      <div>
        <div
          className={cn(
            'flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md group transition-colors',
            depth > 0 && 'ml-4'
          )}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggleExpand(category.id)}
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors',
              !hasChildren && 'invisible'
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
          ) : isLeaf ? (
            <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          
          <span className={cn('font-medium flex-1 truncate', !category.is_active && 'text-muted-foreground')}>
            {category.name}
          </span>

          {isLeaf && (
            <Badge variant="outline" className="text-xs shrink-0">Leaf</Badge>
          )}
          {!category.is_active && (
            <Badge variant="secondary" className="text-xs shrink-0">Inactive</Badge>
          )}
          
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openCreateDialog(category.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add subcategory</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEditDialog(category)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeletingCategory(category)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="border-l border-muted ml-6">
            {children.map(child => (
              <TreeCategoryItem key={child.id} category={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const hasExpandableCategories = categories.some(c => categoryTree(c.id).length > 0)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={paths.app.stores.detail.getHref(storeId!)}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Categories</h1>
              <p className="text-muted-foreground text-sm">{store.name} - {categories.length} categories</p>
            </div>
          </div>
          <Button onClick={() => openCreateDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {uncategorizedData && uncategorizedData.count > 0 && categories.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-amber-500">
                {uncategorizedData.count} uncategorized product{uncategorizedData.count > 1 ? 's' : ''}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkCategorizeModal(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-6">
              Create categories to organize your products. Start from a template or build your own.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button onClick={() => openCreateDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create from Scratch
              </Button>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <span className="text-sm text-muted-foreground">
                {rootCategories.length} root categor{rootCategories.length === 1 ? 'y' : 'ies'}
              </span>
              {hasExpandableCategories && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={expandAll}>
                    Expand All
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={collapseAll}>
                    Collapse All
                  </Button>
                </div>
              )}
            </div>
            <div className="p-2">
              {rootCategories.map(category => (
                <TreeCategoryItem key={category.id} category={category} />
              ))}
            </div>
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

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Start with a pre-built category structure. You can customize it after.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={cn(
                  'border rounded-lg p-4 cursor-pointer transition-colors',
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                )}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2',
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/50'
                  )} />
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyTemplate} disabled={!selectedTemplate || applyTemplate.isPending}>
              {applyTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLeafToBranchDialog} onOpenChange={setShowLeafToBranchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Products Need Reassignment</AlertDialogTitle>
            <AlertDialogDescription>
              The parent category has products assigned to it. Before adding subcategories, 
              you need to move these products to another category:
              <ul className="mt-3 space-y-1">
                {leafToBranchProducts.slice(0, 5).map((title, i) => (
                  <li key={i} className="text-sm">• {title}</li>
                ))}
                {leafToBranchProducts.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    ...and {leafToBranchProducts.length - 5} more
                  </li>
                )}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowLeafToBranchDialog(false)
              setLeafToBranchProducts([])
            }}>
              Got it
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link to={paths.app.stores.products.list.getHref(storeId!)}>
                Go to Products
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {uncategorizedData && (
        <BulkCategorizeModal
          open={showBulkCategorizeModal}
          onOpenChange={setShowBulkCategorizeModal}
          storeId={storeId!}
          products={uncategorizedData.uncategorized_products}
          categories={categories}
        />
      )}
    </div>
  )
}
