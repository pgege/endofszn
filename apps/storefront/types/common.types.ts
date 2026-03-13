export type PaginationParams = {
  page: number
  limit: number
  offset?: number
}

export type ApiResponse<T> = {
  data: T
  error?: string
  message?: string
}

export type ApiError = {
  error: string
  message: string
  statusCode: number
}

