import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess } from "../../../helpers/verify-ownership"
import { wrapHandler } from "../../../helpers/wrap-handler"

function requirePriceListOwnership(priceList: any, storeId: string) {
  const plRules = priceList.price_list_rules || []
  const hasStoreRule = plRules.some(
    (r: any) => r.attribute === "store_id" && r.value?.includes(storeId)
  )
  if (!hasStoreRule) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Price list does not belong to this store`)
  }
}

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const priceListId = req.params.priceListId
  await requireStoreAccess(req, storeId)

  const pricingModule = req.scope.resolve(Modules.PRICING)

  const priceList = await pricingModule.retrievePriceList(priceListId, {
    relations: ["prices", "price_list_rules"],
  })
  requirePriceListOwnership(priceList, storeId)

  res.json({ price_list: priceList })
})
