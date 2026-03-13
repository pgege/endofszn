"use client"

import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EcommerceReview, EcommerceRatingBreakdown } from "../types"

interface Review02Props {
  title?: string
  averageRating?: number
  totalCount?: number
  breakdown?: EcommerceRatingBreakdown[]
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

export function Review02({
  title,
  averageRating,
  totalCount,
  breakdown,
  reviews,
  className,
}: Review02Props) {
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
        <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Rating summary with bar chart */}
          <div className="lg:col-span-4">
            <div className="rounded-lg border border-border bg-background p-6">
              {(averageRating !== undefined || totalCount !== undefined) && (
                <div className="flex items-center gap-4">
                  {averageRating !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-foreground">
                        {averageRating.toFixed(1)}
                      </span>
                      <StarRating rating={Math.round(averageRating)} />
                    </div>
                  )}
                  {totalCount !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      {totalCount} reviews
                    </span>
                  )}
                </div>
              )}
              {breakdown && breakdown.length > 0 && (
                <div className="mt-6 space-y-3">
                  {[...breakdown].sort((a, b) => b.rating - a.rating).map((item) => (
                    <div key={item.rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{item.rating}</span>
                        <StarIcon className="h-4 w-4 fill-primary text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-8 text-right text-sm text-muted-foreground">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reviews list */}
          <div className="mt-10 lg:col-span-8 lg:mt-0">
            <div className="space-y-8">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-border pb-8 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    {review.avatarSrc ? (
                      <img
                        src={review.avatarSrc}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {review.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-sm text-muted-foreground">
                          {review.date}
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-foreground">
                        {review.author}
                      </p>
                      {review.title && (
                        <h3 className="mt-2 text-sm font-medium text-foreground">
                          {review.title}
                        </h3>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        {review.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
