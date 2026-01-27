import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

export type CreateStoreRecordStepInput = {
  name: string
  default_currency_code: string
}

export const createStoreRecordStep = createStep(
  "create-store-record-step",
  async (input: CreateStoreRecordStepInput, { container }) => {
    const storeModuleService = container.resolve(Modules.STORE)

    const store = await storeModuleService.createStores({
      name: input.name,
      supported_currencies: [
        {
          currency_code: input.default_currency_code,
          is_default: true,
        },
      ],
    })

    return new StepResponse(
      {
        id: store.id,
        name: store.name,
        default_currency_code: input.default_currency_code,
      },
      store.id
    )
  },
  async (storeId, { container }) => {
    if (!storeId) return

    const storeModuleService = container.resolve(Modules.STORE)
    await storeModuleService.deleteStores(storeId)
  }
)
