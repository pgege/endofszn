import { useState, useCallback } from 'react'
import type { DashboardLayout, WidgetType, WidgetSize, GridPosition } from '../types'
import { DEFAULT_LAYOUT, SIZE_PRESETS } from '../constants'
import { WIDGET_REGISTRY } from '../registry'

function storageKey(vendorId: string) {
  return `dashboard-layouts-${vendorId}`
}

function activeKey(vendorId: string) {
  return `dashboard-active-layout-${vendorId}`
}

function loadLayouts(vendorId: string): Record<string, DashboardLayout> {
  try {
    const raw = localStorage.getItem(storageKey(vendorId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persistLayouts(vendorId: string, layouts: Record<string, DashboardLayout>) {
  localStorage.setItem(storageKey(vendorId), JSON.stringify(layouts))
}

function migrateLayout(layout: DashboardLayout): DashboardLayout {
  const validTypes = new Set(Object.keys(WIDGET_REGISTRY))
  const validWidgets = layout.widgets.filter((w) => validTypes.has(w.type))

  if (validWidgets.length === 0) return DEFAULT_LAYOUT

  const validIds = new Set(validWidgets.map((w) => w.id))
  const validGrid = layout.grid.filter((g) => validIds.has(g.i))

  return { ...layout, widgets: validWidgets, grid: validGrid }
}

function loadActiveLayout(vendorId: string): DashboardLayout {
  try {
    const raw = localStorage.getItem(activeKey(vendorId))
    if (!raw) return DEFAULT_LAYOUT
    return migrateLayout(JSON.parse(raw))
  } catch {
    return DEFAULT_LAYOUT
  }
}

function persistActiveLayout(vendorId: string, layout: DashboardLayout) {
  localStorage.setItem(activeKey(vendorId), JSON.stringify(layout))
}

let widgetCounter = Date.now()

export function useDashboardLayout(vendorId: string | undefined) {
  const safeVendorId = vendorId ?? '__default__'
  const [layout, setLayoutState] = useState<DashboardLayout>(() => loadActiveLayout(safeVendorId))
  const [savedLayoutNames, setSavedLayoutNames] = useState<string[]>(() =>
    Object.keys(loadLayouts(safeVendorId)),
  )
  const [editMode, setEditMode] = useState(false)

  const setLayout = useCallback(
    (next: DashboardLayout) => {
      setLayoutState(next)
      persistActiveLayout(safeVendorId, next)
    },
    [safeVendorId],
  )

  const updateGrid = useCallback(
    (newPositions: GridPosition[]) => {
      setLayout({ ...layout, grid: newPositions })
    },
    [layout, setLayout],
  )

  const addWidget = useCallback(
    (type: WidgetType, size?: WidgetSize) => {
      const s = size ?? 'sm'
      const preset = SIZE_PRESETS[s]
      const id = `${type}-${++widgetCounter}`

      const maxY = layout.grid.reduce((max, pos) => Math.max(max, pos.y + pos.h), 0)

      const newWidget = { id, type, size: s }
      const newPos: GridPosition = {
        i: id,
        x: 0,
        y: maxY,
        w: preset.defaultW,
        h: preset.defaultH,
        minW: preset.minW,
        minH: preset.minH,
      }

      setLayout({
        ...layout,
        widgets: [...layout.widgets, newWidget],
        grid: [...layout.grid, newPos],
      })
    },
    [layout, setLayout],
  )

  const removeWidget = useCallback(
    (id: string) => {
      setLayout({
        ...layout,
        widgets: layout.widgets.filter((w) => w.id !== id),
        grid: layout.grid.filter((g) => g.i !== id),
      })
    },
    [layout, setLayout],
  )

  const resizeWidget = useCallback(
    (id: string, newSize: WidgetSize) => {
      const preset = SIZE_PRESETS[newSize]
      setLayout({
        ...layout,
        widgets: layout.widgets.map((w) => (w.id === id ? { ...w, size: newSize } : w)),
        grid: layout.grid.map((g) =>
          g.i === id
            ? {
                ...g,
                w: preset.defaultW,
                h: preset.defaultH,
                minW: preset.minW,
                minH: preset.minH,
              }
            : g,
        ),
      })
    },
    [layout, setLayout],
  )

  const saveLayout = useCallback(
    (name: string) => {
      const layouts = loadLayouts(safeVendorId)
      const layoutToSave = { ...layout, name }
      layouts[name] = layoutToSave
      persistLayouts(safeVendorId, layouts)
      setSavedLayoutNames(Object.keys(layouts))
      setLayout(layoutToSave)
    },
    [layout, safeVendorId, setLayout],
  )

  const loadLayout = useCallback(
    (name: string) => {
      const layouts = loadLayouts(safeVendorId)
      const target = layouts[name]
      if (target) {
        setLayout(migrateLayout(target))
      }
    },
    [safeVendorId, setLayout],
  )

  const deleteLayout = useCallback(
    (name: string) => {
      const layouts = loadLayouts(safeVendorId)
      delete layouts[name]
      persistLayouts(safeVendorId, layouts)
      setSavedLayoutNames(Object.keys(layouts))
    },
    [safeVendorId],
  )

  const resetToDefault = useCallback(() => {
    setLayout(DEFAULT_LAYOUT)
  }, [setLayout])

  return {
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
  }
}
