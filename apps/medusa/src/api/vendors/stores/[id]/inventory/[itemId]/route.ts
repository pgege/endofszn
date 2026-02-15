import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, getStoreProductIds } from "../../../helpers/verify-ownership"
import { wrapHandler } from "../../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const itemId = req.params.itemId
  await requireStoreAccess(req, storeId)

  const inventoryModule = req.scope.resolve(Modules.INVENTORY)

  const item = await inventoryModule.retrieveInventoryItem(itemId, {
    relations: ["location_levels"],
  }) as any

  if (item.sku) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: storeData } = await query.graph({
      entity: "store",
      filters: { id: storeId },
      fields: ["products.variants.sku"],
    })
    const storeSKUs = new Set<string>()
    for (const product of storeData[0]?.products || []) {
      for (const variant of (product as any).variants || []) {
        if (variant.sku) storeSKUs.add(variant.sku)
      }
    }
    if (!storeSKUs.has(item.sku)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Inventory item does not belong to this store")
    }
  }

  res.json({ inventory_item: item })
})
