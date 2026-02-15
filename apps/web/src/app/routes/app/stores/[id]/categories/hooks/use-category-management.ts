import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useStores } from '@/lib/api/auth'
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
import { useStoreId } from '../../store-context'

export function useCategoryManagement() {
  const storeId = useStoreId()
  const { data: storesData, isLoading: storeLoading, error: storeError } = useStores({ id: [storeId] })
  const store = storesData?.stores[0]
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategories(storeId, { limit: 1000 })
  const categories = categoriesData?.categories ?? []
  const { data: templatesData } = useCategoryTemplates(storeId)
  const templates = templatesData?.templates ?? []
  const { data: uncategorizedData } = useUncategorizedProducts(storeId)
  const createCategory = useCreateCategory(storeId)
  const updateCategory = useUpdateCategory(storeId)
  const deleteCategory = useDeleteCategory(storeId)
  const applyTemplate = useApplyCategoryTemplate(storeId)

  const [searchParams, setSearchParams] = useSearchParams()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showLeafToBranchDialog, setShowLeafToBranchDialog] = useState(false)
  const [showBulkCategorizeModal, setShowBulkCategorizeModal] = useState(false)
  const [leafToBranchProducts, setLeafToBranchProducts] = useState<string[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [categorySearch, setCategorySearch] = useState('')
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '', description: '', parent_category_id: undefined, is_active: true,
  })

  const isLoading = storeLoading || categoriesLoading
  const rootCategories = useMemo(() => categories.filter(c => !c.parent_category), [categories])

  const categoryTree = useCallback((parentId: string | null): Category[] => {
    return categories.filter(c => (parentId ? c.parent_category?.id === parentId : !c.parent_category)).sort((a, b) => a.rank - b.rank)
  }, [categories])

  const hasExpandableCategories = categories.some(c => categoryTree(c.id).length > 0)

  const toggleExpand = (categoryId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const expandAll = () => {
    const allIds = categories.filter(c => categoryTree(c.id).length > 0).map(c => c.id)
    setExpandedIds(new Set(allIds))
  }

  const collapseAll = () => setExpandedIds(new Set())

  const resetForm = () => setFormData({ name: '', description: '', parent_category_id: undefined, is_active: true })

  const openCreateDialog = (parentId?: string) => {
    resetForm()
    if (parentId) {
      setFormData(f => ({ ...f, parent_category_id: parentId }))
      setExpandedIds(prev => new Set([...prev, parentId]))
    }
    setShowCreateDialog(true)
  }

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId && categories.length > 0 && !editingCategory) {
      const cat = categories.find((c) => c.id === editId)
      if (cat) openEditDialog(cat)
    }
  }, [searchParams, categories])

  const openEditDialog = (category: Category) => {
    setFormData({ name: category.name, description: category.description || '', parent_category_id: category.parent_category?.id, is_active: category.is_active })
    setEditingCategory(category)
    setSearchParams({ edit: category.id }, { replace: true })
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) { toast.error('Category name is required'); return }
    try {
      await createCategory.mutateAsync(formData)
      toast.success('Category created')
      setShowCreateDialog(false)
      resetForm()
    } catch (err: any) {
      if (err?.details?.products_on_parent) {
        setLeafToBranchProducts(err.details.product_titles || [])
        setShowLeafToBranchDialog(true)
        setShowCreateDialog(false)
        return
      }
      toast.error('Failed to create category', { description: err.message })
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) { toast.error('Please select a template'); return }
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
    if (!editingCategory || !formData.name.trim()) { toast.error('Category name is required'); return }
    try {
      await updateCategory.mutateAsync({ categoryId: editingCategory.id, ...formData })
      toast.success('Category updated')
      setEditingCategory(null)
      setSearchParams({}, { replace: true })
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

  const closeEditDialog = () => {
    setEditingCategory(null)
    setSearchParams({}, { replace: true })
  }

  const matchesSearch = useCallback((cat: Category): boolean => {
    if (!categorySearch) return true
    const term = categorySearch.toLowerCase()
    if (cat.name.toLowerCase().includes(term)) return true
    if (cat.category_children?.some(child => matchesSearch(child))) return true
    return false
  }, [categorySearch])

  const filteredRootCategories = useMemo(() => {
    if (!categorySearch) return rootCategories
    return rootCategories.filter(matchesSearch)
  }, [rootCategories, categorySearch, matchesSearch])

  return {
    storeId,
    store,
    isLoading,
    storeError,
    categoriesError,
    categories,
    templates,
    uncategorizedData,
    expandedIds,
    showCreateDialog, setShowCreateDialog,
    showTemplateDialog, setShowTemplateDialog,
    showLeafToBranchDialog, setShowLeafToBranchDialog,
    showBulkCategorizeModal, setShowBulkCategorizeModal,
    leafToBranchProducts,
    editingCategory,
    deletingCategory, setDeletingCategory,
    selectedTemplate, setSelectedTemplate,
    categorySearch, setCategorySearch,
    formData, setFormData,
    filteredRootCategories,
    hasExpandableCategories,
    createPending: createCategory.isPending,
    updatePending: updateCategory.isPending,
    applyTemplatePending: applyTemplate.isPending,
    categoryTree,
    toggleExpand,
    expandAll,
    collapseAll,
    openCreateDialog,
    openEditDialog,
    closeEditDialog,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleApplyTemplate,
  }
}
