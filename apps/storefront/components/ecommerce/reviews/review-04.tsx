"use client"

import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EcommerceReview } from "../types"

interface Review04Props {
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
            "h-4 w-4 shrink-0",
            rating > star ? "fill-primary text-primary" : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  )
}

export function Review04({
  title,
  reviews,
  className,
}: Review04Props) {
  return (
    <div
      data-slot="review"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
        )}
        <ul className="mt-10 space-y-6">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex gap-4 border-b border-border pb-6 last:border-0 last:pb-0"
            >
              {review.avatarSrc ? (
                <img
                  src={review.avatarSrc}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
                  {review.author.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">
                    {review.author}
                  </span>
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-muted-foreground">
                    {review.date}
                  </span>
                </div>
                {review.title && (
                  <h3 className="mt-1 text-sm font-medium text-foreground">
                    {review.title}
                  </h3>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
