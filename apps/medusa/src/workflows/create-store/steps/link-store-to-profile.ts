import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { STORE_PROFILE_MODULE } from "../../../modules/store-profile"

export type LinkStoreToProfileStepInput = {
  store_id: string
  profile_id: string
}

export const linkStoreToProfileStep = createStep(
  "link-store-to-profile-step",
  async (input: LinkStoreToProfileStepInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.create({
      [Modules.STORE]: {
        store_id: input.store_id,
      },
      [STORE_PROFILE_MODULE]: {
        store_profile_id: input.profile_id,
      },
    })

    return new StepResponse(undefined, input)
  },
  async (input, { container }) => {
    if (!input) return

    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.dismiss({
      [Modules.STORE]: {
        store_id: input.store_id,
      },
      [STORE_PROFILE_MODULE]: {
        store_profile_id: input.profile_id,
      },
    })
  }
)
