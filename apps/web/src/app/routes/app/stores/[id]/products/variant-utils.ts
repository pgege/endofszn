import type { OptionInput, VariantInput } from './components/product-form-types'

export function generateVariantId(optionValues: Record<string, string>): string {
  return Object.entries(optionValues)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .join('-')
}

export function generateVariants(options: OptionInput[], existingVariants?: VariantInput[]): VariantInput[] {
  const validOptions = options.filter(o => o.title && o.values.length > 0)

  if (validOptions.length === 0) {
    if (existingVariants) {
      const existing = existingVariants.find(v => v.title === 'Default' || Object.keys(v.optionValues).length === 0)
      if (existing) return [existing]
    }
    return [{
      id: 'default',
      optionValues: {},
      title: 'Default',
      sku: '',
      price: '',
      currency: 'usd',
      images: [],
    }]
  }

  const combinations: Record<string, string>[] = [{}]

  for (const option of validOptions) {
    const newCombinations: Record<string, string>[] = []
    for (const combo of combinations) {
      for (const optVal of option.values) {
        newCombinations.push({ ...combo, [option.title]: optVal.value })
      }
    }
    combinations.length = 0
    combinations.push(...newCombinations)
  }

  return combinations.map(optionValues => {
    const generatedId = generateVariantId(optionValues)
    const title = Object.values(optionValues).join(' / ')

    if (existingVariants) {
      const existingVar = existingVariants.find(v => {
        const existingGenId = generateVariantId(v.optionValues)
        return existingGenId === generatedId
      })
      if (existingVar) return { ...existingVar, optionValues, title }
    }

    return {
      id: generatedId,
      optionValues,
      title,
      sku: '',
      price: '',
      currency: 'usd',
      images: [],
    }
  })
}
