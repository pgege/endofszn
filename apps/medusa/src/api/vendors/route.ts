import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"
import createVendorWorkflow from "../../workflows/create-vendor"
import { wrapHandler } from "./stores/helpers/wrap-handler"

const createVendorSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
})

type CreateVendorBody = z.infer<typeof createVendorSchema>

export const POST = wrapHandler(async (
  req: AuthenticatedMedusaRequest<CreateVendorBody>,
  res: MedusaResponse
) => {
  if (req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Request already authenticated as a vendor."
    )
  }

  if (!req.auth_context?.auth_identity_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Registration token required. First call POST /auth/vendor/emailpass/register"
    )
  }

  const parsed = createVendorSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      parsed.error.errors.map((e) => e.message).join(", ")
    )
  }

  const { result } = await createVendorWorkflow(req.scope).run({
    input: {
      email: parsed.data.email,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      auth_identity_id: req.auth_context.auth_identity_id,
    },
  })

  res.status(201).json({
    vendor: result.vendor_admin,
  })
})
