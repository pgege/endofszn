import { ChevronLeft, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ImageGallery({ images, selectedIndex, onSelect }: {
  images: string[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No image yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-muted overflow-hidden relative group">
        <img src={images[selectedIndex]} alt="" className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onSelect(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelect(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "w-16 h-16 overflow-hidden shrink-0 border-2 transition-colors",
                i === selectedIndex ? "border-primary" : "border-transparent hover:border-muted-foreground"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
