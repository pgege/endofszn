import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

type RouteHandler = (req: AuthenticatedMedusaRequest, res: MedusaResponse) => Promise<void>

export function wrapHandler(fn: RouteHandler): RouteHandler {
  return async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
    try {
      await fn(req, res)
    } catch (error: any) {
      if (error?.__isMedusaError || error?.type) throw error

      let message = "Internal server error"
      if (error instanceof Error) {
        message = error.message
        const cause = (error as any).cause
        if (cause) {
          const causeMsg = cause instanceof Error ? cause.message : String(cause)
          message = `${message}: ${causeMsg}`
        }
      }

      console.error("wrapHandler caught error:", error)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
    }
  }
}
