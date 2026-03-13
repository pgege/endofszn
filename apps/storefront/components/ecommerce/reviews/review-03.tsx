"use client"

import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EcommerceReview } from "../types"

interface Review03Props {
  title?: string
  reviews: EcommerceReview[]
  className?: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[0, 1, 2, 3, 4].map((star) => (
        <StarIcon
          key={star}
          className={cn(
            "h-5 w-5 shrink-0",
            rating > star ? "fill-primary text-primary" : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  )
}

export function Review03({
  title,
  reviews,
  className,
}: Review03Props) {
  return (
    <div
      data-slot="review"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
        )}
        <div className="mt-10 space-y-12">
          {reviews.map((review) => (
            <div key={review.id} className="flex flex-col">
              {/* Avatar and author info */}
              <div className="flex items-center gap-4">
                {review.avatarSrc ? (
                  <img
                    src={review.avatarSrc}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg text-muted-foreground">
                    {review.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{review.author}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm text-muted-foreground">
                      {review.date}
                    </span>
                  </div>
                </div>
              </div>
              {/* Review content below */}
              <div className="mt-6 rounded-lg border border-border bg-muted/30 p-6">
                {review.title && (
                  <h3 className="text-sm font-medium text-foreground">
                    {review.title}
                  </h3>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {review.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
