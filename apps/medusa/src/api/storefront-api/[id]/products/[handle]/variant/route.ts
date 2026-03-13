import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { formatPrice } from "../../../../helpers"

const RESERVED_PARAMS = new Set(["limit", "offset", "q", "order", "status", "fields"])

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeId = req.params.id
  const handle = req.params.handle

  const selections: Record<string, string> = {}
  for (const [key, value] of Object.entries(req.query)) {
    if (!RESERVED_PARAMS.has(key) && typeof value === "string") {
      selections[key] = value
    }
  }

  if (Object.keys(selections).length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "At least one option selection is required (e.g., ?Size=10&Color=Black)")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: [
      "products.id",
      "products.handle",
      "products.status",
      "products.images.*",
      "products.variants.id",
      "products.variants.manage_inventory",
      "products.variants.allow_backorder",
      "products.variants.options.*",
      "products.variants.prices.*",
      "products.options.id",
      "products.options.title",
    ],
  })

  const allProducts = storeWithProducts[0]?.products || []
  const product = allProducts.find(
    (p: any) => p.handle === handle && p.status === "published"
  )

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product with handle "${handle}" not found in this store`)
  }

  const optionTitleToId: Record<string, string> = {}
  for (const opt of product.options || []) {
    optionTitleToId[opt.title] = opt.id
  }

  const matchedVariant = (product.variants || []).find((variant: any) => {
    const variantOptions = variant.options || []
    return Object.entries(selections).every(([optionName, optionValue]) => {
      const optionId = optionTitleToId[optionName]
      if (!optionId) return false
      return variantOptions.some(
        (vo: any) => vo.option_id === optionId && vo.value === optionValue
      )
    })
  })

  if (!matchedVariant) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "No variant matches the selected options")
  }

  const prices = matchedVariant.prices || []
  const firstPrice = prices[0]
  const formattedPrice = firstPrice
    ? formatPrice(firstPrice.amount, firstPrice.currency_code)
    : "Contact for price"
  const currencyCode = firstPrice?.currency_code || "usd"

  const inStock = !matchedVariant.manage_inventory || matchedVariant.allow_backorder || true

  const productImages = (product.images || []).map((img: any) => ({ id: img.id, url: img.url }))
  const images = productImages.length > 0 ? productImages : []

  res.json({
    variant: {
      id: matchedVariant.id,
      price: formattedPrice,
      currency_code: currencyCode,
      inStock,
      images,
    },
  })
}
