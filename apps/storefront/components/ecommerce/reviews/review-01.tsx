"use client"

import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EcommerceReview } from "../types"

interface Review01Props {
  title?: string
  averageRating?: number
  totalCount?: number
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

export function Review01({
  title,
  averageRating,
  totalCount,
  reviews,
  className,
}: Review01Props) {
  return (
    <div
      data-slot="review"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
        )}
        {(averageRating !== undefined || totalCount !== undefined) && (
          <div className="mt-4 flex items-center gap-4">
            {averageRating !== undefined && (
              <div className="flex items-center gap-2">
                <StarRating rating={averageRating} />
                <span className="text-sm font-medium text-foreground">
                  {averageRating.toFixed(1)}
                </span>
              </div>
            )}
            {totalCount !== undefined && (
              <span className="text-sm text-muted-foreground">
                {totalCount} reviews
              </span>
            )}
          </div>
        )}
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-border bg-background p-6"
            >
              <div className="flex items-center gap-4">
                {review.avatarSrc ? (
                  <img
                    src={review.avatarSrc}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {review.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <StarRating rating={review.rating} />
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {review.author}
                  </p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
              {review.title && (
                <h3 className="mt-4 text-sm font-medium text-foreground">
                  {review.title}
                </h3>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {review.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
