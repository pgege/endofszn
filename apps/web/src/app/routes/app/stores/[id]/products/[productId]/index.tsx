import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { paths } from '@/config/paths'
import { cn } from '@/lib/utils'
import { useProductDetail } from '../hooks/use-product-detail'
import {
  BasicsSection,
  ImagesSection,
  PricingSection,
  OptionsSection,
  ProductSectionsSection,
  CustomerPreview,
  FullPagePreview,
} from '../components/product-form'
import { ImagesSkeleton, VariantsSkeleton, OptionsSkeleton, PreviewSkeleton, CustomerPreviewSkeleton } from './skeletons'

export default function ProductDetailPage() {
  const d = useProductDetail()

  if (d.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (d.queryError || !d.store || !d.product) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{!d.store ? 'Store not found' : 'Product not found'}</h2>
          <p className="text-muted-foreground mb-4">{d.queryError?.message || 'The requested resource could not be found'}</p>
          <Button asChild><Link to={paths.app.stores.list.getHref()}>Back to Stores</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        storeId={d.storeId}
        product={d.product}
        store={d.store}
        onDelete={d.handleDelete}
      />

      {d.error && (
        <div className="shrink-0 mx-6 mt-4 bg-destructive/15 text-destructive px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{d.error}</span>
          <Button variant="ghost" size="sm" onClick={() => d.setError(null)} className="ml-auto h-6 px-2">Dismiss</Button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <TabNav tabs={d.tabs} currentTab={d.currentTab} onTabChange={d.setCurrentTab} />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {d.currentTab === 'basics' && (
                <BasicsSection
                  title={d.title} setTitle={(v) => { d.setTitle(v); d.setHasChanges(true) }}
                  description={d.description} setDescription={(v) => { d.setDescription(v); d.setHasChanges(true) }}
                  status={d.status} setStatus={(v) => { d.setStatus(v); d.setHasChanges(true) }}
                  categories={d.categories}
                  selectedCategoryIds={d.selectedCategoryIds}
                  setSelectedCategoryIds={(ids) => { d.setSelectedCategoryIds(ids); d.setHasChanges(true) }}
                />
              )}
              {d.currentTab === 'images' && (d.isRelationsLoading ? <ImagesSkeleton /> : (
                <ImagesSection
                  imageLibrary={d.imageLibrary}
                  setImageLibrary={(u) => { d.setImageLibrary(u); d.setHasChanges(true) }}
                  variants={d.variants}
                  setVariants={(u) => { d.setVariants(u); d.setHasChanges(true) }}
                  options={d.options} hasMultipleVariants={d.hasMultipleVariants}
                  uploadingVariantId={d.uploadingVariantId}
                  onLibraryUpload={d.handleLibraryUpload}
                  onApplyToAll={d.applyImagesToAllVariants}
                  _onCopyFrom={d.copyImagesFromVariant}
                  onToggleImage={d.toggleImageForVariant}
                />
              ))}
              {d.currentTab === 'variants' && (d.isRelationsLoading ? <VariantsSkeleton /> : (
                <PricingSection
                  variants={d.variants}
                  setVariants={(u) => { d.setVariants(u); d.setHasChanges(true) }}
                  hasMultipleVariants={d.hasMultipleVariants}
                  bulkPrice={d.bulkPrice} setBulkPrice={d.setBulkPrice}
                  bulkCurrency={d.bulkCurrency} setBulkCurrency={d.setBulkCurrency}
                />
              ))}
              {d.currentTab === 'options' && (d.isRelationsLoading ? <OptionsSkeleton /> : (
                <OptionsSection
                  options={d.options}
                  setOptions={(u) => { d.setOptions(u); d.setHasChanges(true) }}
                  newOptionTitle={d.newOptionTitle} setNewOptionTitle={d.setNewOptionTitle}
                  newValueInputs={d.newValueInputs} setNewValueInputs={d.setNewValueInputs}
                  selectedValues={d.selectedValues} setSelectedValues={d.setSelectedValues}
                  lastClickedValue={d.lastClickedValue} setLastClickedValue={d.setLastClickedValue}
                  onUploadValueImage={d.handleValueImageUpload}
                  activeValueImageUpload={d.activeValueImageUpload}
                />
              ))}
              {d.currentTab === 'info' && (
                <ProductSectionsSection sections={d.sections} setSections={(u) => { d.setSections(u); d.setHasChanges(true) }} />
              )}
              {d.currentTab === 'preview' && (d.isRelationsLoading ? <PreviewSkeleton /> : (
                <FullPagePreview
                  title={d.title} description={d.description} options={d.options}
                  selectedVariant={d.selectedVariant} onSelectOption={d.handleSelectPreviewOption}
                  sections={d.sections}
                />
              ))}
            </div>
          </div>

          {d.currentTab !== 'preview' && (
            <div className="w-80 xl:w-96 border-l bg-muted/30 p-6 hidden lg:block shrink-0 overflow-y-auto">
              {d.isRelationsLoading ? <CustomerPreviewSkeleton /> : (
                <CustomerPreview
                  title={d.title} description={d.description} options={d.options}
                  selectedVariant={d.selectedVariant} onSelectOption={d.handleSelectPreviewOption}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background px-6 py-4 flex justify-between">
        <Button variant="outline" asChild>
          <Link to={paths.app.stores.products.list.getHref(d.storeId)}>Cancel</Link>
        </Button>
        <Button onClick={d.handleSubmit} disabled={d.updateProduct.isPending || !d.hasChanges}>
          {d.updateProduct.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
          ) : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

function PageHeader({ storeId, product, store, onDelete }: {
  storeId: string
  product: { title: string; thumbnail?: string; status: string }
  store: { name: string }
  onDelete: () => void
}) {
  return (
    <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-background">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={paths.app.stores.products.list.getHref(storeId)}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-3">
          {product.thumbnail ? (
            <img src={product.thumbnail} alt="" className="h-10 w-10 object-cover" />
          ) : (
            <div className="h-10 w-10 bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
          )}
          <div>
            <h1 className="text-xl font-bold">{product.title}</h1>
            <p className="text-sm text-muted-foreground">{store.name}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>{product.status}</Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete product?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete "{product.title}". This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

function TabNav({ tabs, currentTab, onTabChange }: {
  tabs: Array<{ id: string; title: string; description: string }>
  currentTab: string
  onTabChange: (tab: any) => void
}) {
  return (
    <nav className="w-48 xl:w-56 border-r bg-muted/30 p-4 space-y-1 hidden lg:block shrink-0 overflow-y-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors",
            currentTab === tab.id && "bg-primary/10 text-primary",
            currentTab !== tab.id && "text-muted-foreground hover:bg-muted"
          )}
        >
          <div>
            <p className="text-sm font-medium">{tab.title}</p>
            <p className="text-xs text-muted-foreground hidden xl:block">{tab.description}</p>
          </div>
        </button>
      ))}
    </nav>
  )
}
