import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Store as StoreIcon, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useStores } from '@/lib/api/auth'
import { paths } from '@/config/paths'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WidgetGrid } from './components/widget-grid'
import { WidgetToolbar } from './components/widget-toolbar'
import { useDashboardLayout } from './hooks/use-dashboard-layout'

export default function DashboardPage() {
  const { vendor } = useAuth()
  const { data: storesData, isLoading, error } = useStores()
  const stores = storesData?.stores ?? []

  const {
    layout,
    savedLayoutNames,
    editMode,
    setEditMode,
    updateGrid,
    addWidget,
    removeWidget,
    resizeWidget,
    saveLayout,
    loadLayout,
    deleteLayout,
    resetToDefault,
  } = useDashboardLayout(vendor?.id)

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev)
  }, [setEditMode])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load stores</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-6 py-8 space-y-6">
          <div>
            <h1 className="text-base font-semibold">Welcome back, {vendor?.firstName || 'there'}!</h1>
            <p className="text-sm text-muted-foreground">Manage your stores and products</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <StoreIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No stores yet</h3>
              <p className="text-muted-foreground text-center mb-4">Create your first store to start selling products</p>
              <Button asChild>
                <Link to={paths.app.stores.new.getHref()}>
                  <Plus className="h-4 w-4 mr-2" />Create Store
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4 space-y-4">
        <div>
          <h1 className="text-base font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {vendor?.firstName || 'there'}
          </p>
        </div>
        <WidgetToolbar
          layout={layout}
          savedLayouts={savedLayoutNames}
          editMode={editMode}
          onToggleEditMode={toggleEditMode}
          onAddWidget={addWidget}
          onSaveLayout={saveLayout}
          onLoadLayout={loadLayout}
          onDeleteLayout={deleteLayout}
          onResetLayout={resetToDefault}
        />
      </div>

      <div className="flex-1 overflow-auto px-4">
        <WidgetGrid
          layout={layout}
          editMode={editMode}
          onGridChange={updateGrid}
          onRemoveWidget={removeWidget}
          onResizeWidget={resizeWidget}
        />
      </div>
    </div>
  )
}
