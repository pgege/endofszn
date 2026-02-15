import { useState, useRef, useMemo } from 'react'
import { X, Check, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type CategoryOption = {
  id: string
  name: string
  parent_category: CategoryOption | null
}

interface CategoryAutocompleteProps {
  categories: CategoryOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  disabled?: boolean
}

type GroupedCategories = {
  parentPath: string
  parentId: string | null
  categories: CategoryOption[]
}

export function CategoryAutocomplete({
  categories,
  selectedIds,
  onChange,
  placeholder = 'Select categories...',
  disabled = false,
}: CategoryAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)

  const getCategoryPath = (category: CategoryOption): string => {
    if (category.parent_category) {
      return `${getCategoryPath(category.parent_category)} > ${category.name}`
    }
    return category.name
  }

  const getParentPath = (category: CategoryOption): string => {
    if (category.parent_category) {
      return getCategoryPath(category.parent_category)
    }
    return ''
  }

  const groupedCategories = useMemo(() => {
    const searchLower = search.toLowerCase().trim()
    
    const filtered = searchLower
      ? categories.filter(cat => {
          const path = getCategoryPath(cat).toLowerCase()
          return path.includes(searchLower)
        })
      : categories

    const groups = new Map<string, GroupedCategories>()

    for (const cat of filtered) {
      const parentPath = getParentPath(cat)
      const parentId = cat.parent_category?.id || null

      if (!groups.has(parentPath)) {
        groups.set(parentPath, {
          parentPath,
          parentId,
          categories: [],
        })
      }
      groups.get(parentPath)!.categories.push(cat)
    }

    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (a.parentPath === '' && b.parentPath !== '') return -1
      if (a.parentPath !== '' && b.parentPath === '') return 1
      return a.parentPath.localeCompare(b.parentPath)
    })

    return sortedGroups
  }, [categories, search])

  const selectedCategories = useMemo(() => {
    return categories.filter(cat => selectedIds.includes(cat.id))
  }, [categories, selectedIds])

  const toggleCategory = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter(id => id !== categoryId))
    } else {
      onChange([...selectedIds, categoryId])
    }
  }

  const removeCategory = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedIds.filter(id => id !== categoryId))
  }

  const hasResults = groupedCategories.length > 0

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || categories.length === 0}
            className={cn(
              'w-full justify-between font-normal',
              selectedIds.length === 0 && 'text-muted-foreground'
            )}
          >
            {selectedIds.length === 0 ? (
              <span>{categories.length === 0 ? 'No categories available' : placeholder}</span>
            ) : (
              <span>{selectedIds.length} categor{selectedIds.length === 1 ? 'y' : 'ies'} selected</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0" 
          align="start"
          style={{ width: triggerRef.current?.offsetWidth }}
        >
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search categories..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {!hasResults && <CommandEmpty>No categories found.</CommandEmpty>}
              {groupedCategories.map((group) => (
                <CommandGroup 
                  key={group.parentPath || 'root'} 
                  heading={group.parentPath || 'Top Level'}
                >
                  {group.categories.map((category) => {
                    const isSelected = selectedIds.includes(category.id)
                    return (
                      <CommandItem
                        key={category.id}
                        value={category.id}
                        onSelect={() => toggleCategory(category.id)}
                        className="cursor-pointer"
                      >
                        <div className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center border border-primary',
                          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50'
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="truncate">{category.name}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="max-w-[200px] truncate">{getCategoryPath(category)}</span>
              <button
                type="button"
                onClick={(e) => removeCategory(category.id, e)}
                className="ml-1 p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
