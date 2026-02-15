import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, FolderTree, AlertTriangle, Sparkles, Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { paths } from '@/config/paths'
import { TreeCategoryItem } from './components/tree-category-item'
import {
  CreateCategoryDialog,
  EditCategoryDialog,
  DeleteCategoryDialog,
  TemplateDialog,
  LeafToBranchDialog,
} from './components/category-dialogs'
import { BulkCategorizeModal } from './components/bulk-categorize-modal'
import { useCategoryManagement } from './hooks/use-category-management'

export default function CategoriesPage() {
  const mgmt = useCategoryManagement()

  if (mgmt.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  if (mgmt.storeError || mgmt.categoriesError || !mgmt.store) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{mgmt.storeError ? 'Store not found' : 'Failed to load categories'}</h2>
          <p className="text-muted-foreground">{(mgmt.storeError || mgmt.categoriesError)?.message || 'Something went wrong'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={paths.app.stores.detail.getHref(mgmt.storeId)}>
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold">Categories</h1>
              <p className="text-muted-foreground text-sm">{mgmt.store.name} - {mgmt.categories.length} categories</p>
            </div>
          </div>
          <Button onClick={() => mgmt.openCreateDialog()}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
        </div>

        {mgmt.uncategorizedData && mgmt.uncategorizedData.count > 0 && mgmt.categories.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-amber-500">{mgmt.uncategorizedData.count} uncategorized product{mgmt.uncategorizedData.count > 1 ? 's' : ''}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => mgmt.setShowBulkCategorizeModal(true)}>
              <Package className="h-4 w-4 mr-2" />Assign
            </Button>
          </div>
        )}

        {mgmt.categories.length === 0 ? (
          <div className="border-2 border-dashed p-12 text-center">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-6">Create categories to organize your products. Start from a template or build your own.</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => mgmt.setShowTemplateDialog(true)}><Sparkles className="h-4 w-4 mr-2" />Use Template</Button>
              <Button onClick={() => mgmt.openCreateDialog()}><Plus className="h-4 w-4 mr-2" />Create from Scratch</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter categories..." value={mgmt.categorySearch} onChange={(e) => mgmt.setCategorySearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <div className="border">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <span className="text-sm text-muted-foreground">{mgmt.filteredRootCategories.length} root categor{mgmt.filteredRootCategories.length === 1 ? 'y' : 'ies'}</span>
                {mgmt.hasExpandableCategories && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={mgmt.expandAll}>Expand All</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={mgmt.collapseAll}>Collapse All</Button>
                  </div>
                )}
              </div>
              <div className="p-2">
                {mgmt.filteredRootCategories.map(category => (
                  <TreeCategoryItem
                    key={category.id}
                    category={category}
                    expandedIds={mgmt.expandedIds}
                    onToggleExpand={mgmt.toggleExpand}
                    onAddChild={mgmt.openCreateDialog}
                    onEdit={mgmt.openEditDialog}
                    onDelete={mgmt.setDeletingCategory}
                    getChildren={(parentId) => mgmt.categoryTree(parentId)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <CreateCategoryDialog
        open={mgmt.showCreateDialog} onOpenChange={mgmt.setShowCreateDialog}
        formData={mgmt.formData} setFormData={mgmt.setFormData}
        categories={mgmt.categories} isPending={mgmt.createPending} onCreate={mgmt.handleCreate}
      />
      <EditCategoryDialog
        category={mgmt.editingCategory} formData={mgmt.formData} setFormData={mgmt.setFormData}
        categories={mgmt.categories} isPending={mgmt.updatePending} onUpdate={mgmt.handleUpdate}
        onClose={mgmt.closeEditDialog}
      />
      <DeleteCategoryDialog category={mgmt.deletingCategory} onClose={() => mgmt.setDeletingCategory(null)} onDelete={mgmt.handleDelete} />
      <TemplateDialog
        open={mgmt.showTemplateDialog} onOpenChange={mgmt.setShowTemplateDialog}
        templates={mgmt.templates} selectedTemplate={mgmt.selectedTemplate} setSelectedTemplate={mgmt.setSelectedTemplate}
        isPending={mgmt.applyTemplatePending} onApply={mgmt.handleApplyTemplate}
      />
      <LeafToBranchDialog open={mgmt.showLeafToBranchDialog} onOpenChange={mgmt.setShowLeafToBranchDialog} products={mgmt.leafToBranchProducts} />
      {mgmt.uncategorizedData && (
        <BulkCategorizeModal open={mgmt.showBulkCategorizeModal} onOpenChange={mgmt.setShowBulkCategorizeModal} products={mgmt.uncategorizedData.uncategorized_products} categories={mgmt.categories} />
      )}
    </div>
  )
}
