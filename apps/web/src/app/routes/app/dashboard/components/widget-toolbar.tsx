import { useState } from 'react'
import { Plus, Save, RotateCcw, ChevronDown, Layout, Pencil, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import type { WidgetType, WidgetSize, DashboardLayout } from '../types'
import { WIDGET_REGISTRY } from '../registry'

interface WidgetToolbarProps {
  layout: DashboardLayout
  savedLayouts: string[]
  editMode: boolean
  onToggleEditMode: () => void
  onAddWidget: (type: WidgetType, size?: WidgetSize) => void
  onSaveLayout: (name: string) => void
  onLoadLayout: (name: string) => void
  onDeleteLayout: (name: string) => void
  onResetLayout: () => void
}

export function WidgetToolbar({
  layout,
  savedLayouts,
  editMode,
  onToggleEditMode,
  onAddWidget,
  onSaveLayout,
  onLoadLayout,
  onDeleteLayout,
  onResetLayout,
}: WidgetToolbarProps) {
  const [savePopoverOpen, setSavePopoverOpen] = useState(false)
  const [saveName, setSaveName] = useState('')

  const handleSave = () => {
    const name = saveName.trim() || layout.name
    onSaveLayout(name)
    setSaveName('')
    setSavePopoverOpen(false)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Layout className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{layout.name}</span>
        <span className="text-xs text-muted-foreground">
          ({layout.widgets.length} widget{layout.widgets.length !== 1 ? 's' : ''})
        </span>
      </div>

      <div className="flex items-center gap-2">
        {editMode && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Widget
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {(Object.entries(WIDGET_REGISTRY) as [WidgetType, typeof WIDGET_REGISTRY[WidgetType]][]).map(([type, entry]) => {
                  const Icon = entry.icon
                  return (
                    <DropdownMenuItem key={type} onClick={() => onAddWidget(type, entry.defaultSize)}>
                      <Icon className="h-4 w-4 mr-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{entry.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="h-3.5 w-3.5 mr-1" />Save
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Save Layout</p>
                  <Input
                    placeholder={layout.name}
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                  <Button size="sm" className="w-full" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="sm" onClick={onResetLayout}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
            </Button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Layout className="h-3.5 w-3.5 mr-1" />Layouts
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {savedLayouts.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-xs text-muted-foreground">No saved layouts yet</span>
              </DropdownMenuItem>
            ) : (
              <>
                {savedLayouts.map((name) => (
                  <DropdownMenuItem key={name} onClick={() => onLoadLayout(name)}>
                    {name}
                  </DropdownMenuItem>
                ))}
                {editMode && (
                  <>
                    <DropdownMenuSeparator />
                    {savedLayouts.map((name) => (
                      <DropdownMenuItem
                        key={`delete-${name}`}
                        onClick={() => onDeleteLayout(name)}
                        className="text-destructive"
                      >
                        Delete "{name}"
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={editMode ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleEditMode}
        >
          {editMode ? (
            <><Check className="h-3.5 w-3.5 mr-1" />Done</>
          ) : (
            <><Pencil className="h-3.5 w-3.5 mr-1" />Customize</>
          )}
        </Button>
      </div>
    </div>
  )
}
