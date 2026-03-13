export function formatPrice(amount: number, currencyCode = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount / 100)
}

export function computeLowestPrice(variants: any[]): { price: string; currency_code: string } {
  let lowest: { amount: number; currency: string } | null = null

  for (const variant of variants || []) {
    for (const p of variant.prices || []) {
      if (!lowest || p.amount < lowest.amount) {
        lowest = { amount: p.amount, currency: p.currency_code }
      }
    }
  }

  return lowest
    ? { price: formatPrice(lowest.amount, lowest.currency), currency_code: lowest.currency }
    : { price: "Contact for price", currency_code: "usd" }
}

export function computeOptionsWithAvailability(product: any): { name: string; values: { value: string; inStock: boolean }[] }[] {
  const options = product.options || []
  const variants = product.variants || []

  return options.map((opt: any) => {
    const values = (opt.values || []).map((v: any) => {
      const hasStockVariant = variants.some((variant: any) => {
        const matchesOption = (variant.options || []).some(
          (vo: any) => vo.option_id === opt.id && vo.value === v.value
        )
        if (!matchesOption) return false
        if (!variant.manage_inventory) return true
        if (variant.allow_backorder) return true
        return true
      })
      return { value: v.value, inStock: hasStockVariant }
    })
    return { name: opt.title, values }
  })
}

export function normalizeProduct(raw: any): any {
  const { price, currency_code } = computeLowestPrice(raw.variants)
  const metadata = raw.metadata ?? null
  const highlights: string[] = Array.isArray(metadata?.highlights) ? metadata.highlights : []
  const details: string | null = typeof metadata?.details === "string" ? metadata.details : null

  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    subtitle: raw.subtitle ?? null,
    description: raw.description ?? null,
    status: raw.status ?? "draft",
    thumbnail: raw.thumbnail ?? null,
    price,
    currency_code,
    images: (raw.images || []).map((img: any) => ({ id: img.id, url: img.url })),
    variants: (raw.variants || []).map((v: any) => ({
      id: v.id,
      title: v.title,
      sku: v.sku ?? null,
      manage_inventory: v.manage_inventory ?? false,
      allow_backorder: v.allow_backorder ?? false,
      options: (v.options || []).map((o: any) => ({
        id: o.id,
        value: o.value,
        option_id: o.option_id,
        ...(o.option ? { option: { id: o.option.id, title: o.option.title } } : {}),
      })),
      prices: (v.prices || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        currency_code: p.currency_code,
      })),
    })),
    options: (raw.options || []).map((o: any) => ({
      id: o.id,
      title: o.title,
      values: (o.values || []).map((v: any) => ({
        id: v.id,
        value: v.value,
        option_id: v.option_id,
      })),
    })),
    categories: (raw.categories || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
    })),
    metadata,
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
    optionsWithAvailability: computeOptionsWithAvailability(raw),
    highlights,
    details,
  }
}
