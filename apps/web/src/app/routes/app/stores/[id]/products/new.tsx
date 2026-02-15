import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Check, AlertCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { paths } from '@/config/paths'
import { cn } from '@/lib/utils'
import {
  CustomerPreview,
  FullPagePreview,
  BasicsSection,
  OptionsSection,
  PricingSection,
  ImagesSection,
  ProductSectionsSection,
} from './components/product-form'
import { useNewProductForm } from './hooks/use-new-product-form'

export default function NewProductPage() {
  const form = useNewProductForm()

  if (form.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (form.storeError || !form.store) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Store not found</h2>
          <p className="text-muted-foreground mb-4">
            {form.storeError?.message || 'Something went wrong'}
          </p>
          <Button asChild>
            <Link to={paths.app.stores.list.getHref()}>Back to Stores</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-b bg-background">
        <Button variant="ghost" size="icon" asChild>
          <Link to={paths.app.stores.products.list.getHref(form.storeId)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">New Product</h1>
          <p className="text-sm text-muted-foreground">{form.store.name}</p>
        </div>
      </div>

      {form.error && (
        <div className="shrink-0 mx-6 mt-4 bg-destructive/15 text-destructive px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{form.error}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-48 xl:w-56 border-r bg-muted/30 p-4 space-y-1 hidden lg:block shrink-0 overflow-y-auto">
          {form.steps.map((step, index) => {
            const stepStatus = form.getStepStatus(step.id)
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => form.goToStep(step.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors",
                  stepStatus === 'current' && "bg-primary/10 text-primary",
                  stepStatus === 'complete' && "text-muted-foreground hover:bg-muted",
                  stepStatus === 'upcoming' && "text-muted-foreground/50"
                )}
              >
                <div className={cn(
                  "w-7 h-7 flex items-center justify-center text-xs font-semibold border-2",
                  stepStatus === 'current' && "border-primary bg-primary text-primary-foreground",
                  stepStatus === 'complete' && "border-green-500 bg-green-500 text-white",
                  stepStatus === 'upcoming' && "border-muted-foreground/30"
                )}>
                  {stepStatus === 'complete' ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground hidden xl:block">{step.description}</p>
                </div>
              </button>
            )
          })}
        </nav>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {form.currentStep === 'basics' && (
                <BasicsSection
                  title={form.title} setTitle={form.setTitle}
                  description={form.description} setDescription={form.setDescription}
                  status={form.status} setStatus={form.setStatus}
                  categories={form.categories}
                  selectedCategoryIds={form.selectedCategoryIds} setSelectedCategoryIds={form.setSelectedCategoryIds}
                  isCreate
                />
              )}

              {form.currentStep === 'options' && (
                <OptionsSection
                  options={form.options} setOptions={form.setOptions}
                  newOptionTitle={form.newOptionTitle} setNewOptionTitle={form.setNewOptionTitle}
                  newValueInputs={form.newValueInputs} setNewValueInputs={form.setNewValueInputs}
                  selectedValues={form.selectedValues} setSelectedValues={form.setSelectedValues}
                  lastClickedValue={form.lastClickedValue} setLastClickedValue={form.setLastClickedValue}
                  onUploadValueImage={form.handleValueImageUpload}
                  activeValueImageUpload={form.activeValueImageUpload}
                />
              )}

              {form.currentStep === 'pricing' && (
                <PricingSection
                  variants={form.variants} setVariants={form.setVariants}
                  hasMultipleVariants={form.hasMultipleVariants}
                  bulkPrice={form.bulkPrice} setBulkPrice={form.setBulkPrice}
                  bulkCurrency={form.bulkCurrency} setBulkCurrency={form.setBulkCurrency}
                />
              )}

              {form.currentStep === 'images' && (
                <ImagesSection
                  imageLibrary={form.imageLibrary} setImageLibrary={form.setImageLibrary}
                  variants={form.variants} setVariants={form.setVariants}
                  options={form.options} hasMultipleVariants={form.hasMultipleVariants}
                  uploadingVariantId={form.uploadingVariantId}
                  onLibraryUpload={form.handleLibraryUpload}
                  onApplyToAll={form.applyImagesToAllVariants}
                  _onCopyFrom={form.copyImagesFromVariant}
                  onToggleImage={form.toggleImageForVariant}
                />
              )}

              {form.currentStep === 'info' && (
                <ProductSectionsSection sections={form.sections} setSections={form.setSections} />
              )}

              {form.currentStep === 'review' && (
                <div className="space-y-6">
                  <div className="text-center pb-4 border-b">
                    <h2 className="text-xl font-semibold mb-1">This is how customers will see your product</h2>
                    <p className="text-muted-foreground">Interact with the preview below. Click "Create Product" when you're ready.</p>
                  </div>
                  <div className="bg-muted/30 p-6 border">
                    <FullPagePreview
                      title={form.title} description={form.description}
                      options={form.options} selectedVariant={form.selectedVariant}
                      onSelectOption={form.handleSelectPreviewOption} sections={form.sections}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
                    <button type="button" onClick={() => form.goToStep('basics')} className="underline hover:text-foreground">Edit basics</button>
                    <span>•</span>
                    <button type="button" onClick={() => form.goToStep('options')} className="underline hover:text-foreground">Edit options</button>
                    <span>•</span>
                    <button type="button" onClick={() => form.goToStep('pricing')} className="underline hover:text-foreground">Edit pricing</button>
                    <span>•</span>
                    <button type="button" onClick={() => form.goToStep('images')} className="underline hover:text-foreground">Edit images</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {form.currentStep !== 'review' && (
            <div className="w-80 xl:w-96 border-l bg-muted/30 p-6 hidden lg:block shrink-0 overflow-y-auto">
              <CustomerPreview
                title={form.title} description={form.description}
                options={form.options} selectedVariant={form.selectedVariant}
                onSelectOption={form.handleSelectPreviewOption} sections={form.sections}
              />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background px-6 py-4 flex justify-between">
        <Button type="button" variant="outline" onClick={form.goPrev} disabled={form.currentStepIndex === 0}>
          Back
        </Button>
        {form.currentStep === 'review' ? (
          <Button onClick={form.handleSubmit} disabled={!form.canSubmit() || form.isSubmitting} size="lg">
            {form.isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
            ) : (
              <>Create Product<ChevronRight className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        ) : (
          <Button onClick={form.goNext} disabled={!form.canProceed()}>
            Continue<ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
