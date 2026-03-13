import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"

const STORE_ID = "store_01KHEV1M5ARBTW2SC4KAAXC2J2"
const HANDLE_SUFFIX = STORE_ID.slice(-8).toLowerCase()

export default async function seedStorefrontData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT)
  const storeModule = container.resolve(Modules.STORE)

  const store = await storeModule.retrieveStore(STORE_ID)
  if (!store) {
    logger.error(`Store ${STORE_ID} not found. Aborting seed.`)
    return
  }
  logger.info(`Seeding storefront data for store: ${store.name} (${STORE_ID})`)

  const { data: storeData } = await query.graph({
    entity: "store",
    filters: { id: STORE_ID },
    fields: ["default_sales_channel_id"],
  })
  const salesChannelId = storeData[0]?.default_sales_channel_id

  const { data: existingProducts } = await query.graph({
    entity: "store",
    filters: { id: STORE_ID },
    fields: ["products.id"],
  })
  const existingProductIds = (existingProducts[0]?.products || []).map((p: any) => p.id)

  if (existingProductIds.length > 0) {
    for (const pid of existingProductIds) {
      try {
        await productModule.updateProducts(pid, { status: ProductStatus.PUBLISHED })
      } catch (e) {
        logger.warn(`Could not publish product ${pid}: ${e}`)
      }
    }
    logger.info(`Published ${existingProductIds.length} existing products`)
  }

  logger.info("Creating facet group categories (L0)...")
  const { result: l0Cats } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Department", handle: `department-${HANDLE_SUFFIX}`, is_active: true, is_internal: true },
        { name: "Gender", handle: `gender-${HANDLE_SUFFIX}`, is_active: true, is_internal: true },
        { name: "Brand", handle: `brand-${HANDLE_SUFFIX}`, is_active: true, is_internal: true },
        { name: "Activity", handle: `activity-${HANDLE_SUFFIX}`, is_active: true, is_internal: true },
      ],
    },
  })

  const departmentGroup = l0Cats.find((c: any) => c.name === "Department")!
  const genderGroup = l0Cats.find((c: any) => c.name === "Gender")!
  const brandGroup = l0Cats.find((c: any) => c.name === "Brand")!
  const activityGroup = l0Cats.find((c: any) => c.name === "Activity")!

  logger.info(`Created 4 facet groups: ${l0Cats.map((c: any) => c.name).join(", ")}`)

  for (const cat of l0Cats) {
    await link.create({
      [Modules.STORE]: { store_id: STORE_ID },
      [Modules.PRODUCT]: { product_category_id: cat.id },
    })
  }

  logger.info("Creating Department children (L1)...")
  const { result: deptChildren } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Footwear", handle: `footwear-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: departmentGroup.id },
        { name: "Apparel", handle: `apparel-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: departmentGroup.id },
        { name: "Accessories", handle: `accessories-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: departmentGroup.id },
      ],
    },
  })

  const footwear = deptChildren.find((c: any) => c.name === "Footwear")!
  const apparel = deptChildren.find((c: any) => c.name === "Apparel")!
  const accessories = deptChildren.find((c: any) => c.name === "Accessories")!

  for (const cat of deptChildren) {
    await link.create({
      [Modules.STORE]: { store_id: STORE_ID },
      [Modules.PRODUCT]: { product_category_id: cat.id },
    })
  }

  logger.info("Creating Department grandchildren (L2)...")
  const { result: footwearChildren } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Running Shoes", handle: `running-shoes-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: footwear.id },
        { name: "Basketball Shoes", handle: `basketball-shoes-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: footwear.id },
      ],
    },
  })

  const { result: apparelChildren } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Tops", handle: `tops-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: apparel.id },
        { name: "Bottoms", handle: `bottoms-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: apparel.id },
        { name: "Outerwear", handle: `outerwear-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: apparel.id },
      ],
    },
  })

  const { result: accessoryChildren } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Bags", handle: `bags-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: accessories.id },
        { name: "Hats", handle: `hats-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: accessories.id },
      ],
    },
  })

  const allL2Dept = [...footwearChildren, ...apparelChildren, ...accessoryChildren]
  for (const cat of allL2Dept) {
    await link.create({
      [Modules.STORE]: { store_id: STORE_ID },
      [Modules.PRODUCT]: { product_category_id: cat.id },
    })
  }

  const runningShoes = footwearChildren.find((c: any) => c.name === "Running Shoes")!
  const basketballShoes = footwearChildren.find((c: any) => c.name === "Basketball Shoes")!
  const tops = apparelChildren.find((c: any) => c.name === "Tops")!
  const bottoms = apparelChildren.find((c: any) => c.name === "Bottoms")!
  const outerwear = apparelChildren.find((c: any) => c.name === "Outerwear")!
  const bags = accessoryChildren.find((c: any) => c.name === "Bags")!
  const hats = accessoryChildren.find((c: any) => c.name === "Hats")!

  logger.info("Creating Gender children (L1)...")
  const { result: genderChildren } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Men's", handle: `mens-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: genderGroup.id },
        { name: "Women's", handle: `womens-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: genderGroup.id },
        { name: "Unisex", handle: `unisex-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: genderGroup.id },
      ],
    },
  })

  const mens = genderChildren.find((c: any) => c.name === "Men's")!
  const womens = genderChildren.find((c: any) => c.name === "Women's")!
  const unisex = genderChildren.find((c: any) => c.name === "Unisex")!

  for (const cat of genderChildren) {
    await link.create({
      [Modules.STORE]: { store_id: STORE_ID },
      [Modules.PRODUCT]: { product_category_id: cat.id },
    })
  }

  logger.info("Creating Brand children (L1)...")
  const { result: brandChildren } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Nike", handle: `nike-brand-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: brandGroup.id },
        { name: "Adidas", handle: `adidas-brand-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: brandGroup.id },
      ],
    },
  })

  const nike = brandChildren.find((c: any) => c.name === "Nike")!
  const adidas = brandChildren.find((c: any) => c.name === "Adidas")!

  for (const cat of brandChildren) {
    await link.create({
      [Modules.STORE]: { store_id: STORE_ID },
      [Modules.PRODUCT]: { product_category_id: cat.id },
    })
  }

  logger.info("Creating Activity children (L1)...")
  const { result: activityChildren } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Running", handle: `running-activity-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: activityGroup.id },
        { name: "Training", handle: `training-activity-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: activityGroup.id },
        { name: "Basketball", handle: `basketball-activity-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: activityGroup.id },
        { name: "Lifestyle", handle: `lifestyle-activity-${HANDLE_SUFFIX}`, is_active: true, parent_category_id: activityGroup.id },
      ],
    },
  })

  const running = activityChildren.find((c: any) => c.name === "Running")!
  const training = activityChildren.find((c: any) => c.name === "Training")!
  const basketball = activityChildren.find((c: any) => c.name === "Basketball")!
  const lifestyle = activityChildren.find((c: any) => c.name === "Lifestyle")!

  for (const cat of activityChildren) {
    await link.create({
      [Modules.STORE]: { store_id: STORE_ID },
      [Modules.PRODUCT]: { product_category_id: cat.id },
    })
  }

  logger.info("All categories created and linked to store")

  logger.info("Creating products with faceted categories...")

  const productsData = [
    {
      title: "Air Max 90",
      handle: `air-max-90-${HANDLE_SUFFIX}`,
      description: "The Air Max 90 stays true to its OG running roots with the iconic visible Air unit that provides lasting comfort.",
      status: ProductStatus.PUBLISHED,
      thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
      images: [
        { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
        { url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800" },
        { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800" },
        { url: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800" },
      ],
      category_ids: [runningShoes.id, unisex.id, nike.id, running.id],
      metadata: {
        highlights: ["Visible Air unit in the heel", "Leather and synthetic upper", "Rubber Waffle outsole", "Padded collar"],
        details: "Material: Leather, Synthetic, Mesh. Sole: Rubber. Air Max cushioning for all-day comfort.",
      },
      options: [
        { title: "Size", values: ["7", "8", "9", "10", "11", "12"] },
        { title: "Color", values: ["White", "Black", "Red"] },
      ],
      variants: [
        ...["7", "8", "9", "10", "11", "12"].flatMap((size) =>
          ["White", "Black", "Red"].map((color) => ({
            title: `${size} / ${color}`,
            sku: `AM90-${size}-${color.toUpperCase()}`,
            manage_inventory: false,
            options: { Size: size, Color: color },
            prices: [
              { amount: 13000, currency_code: "usd" },
              { amount: 12000, currency_code: "eur" },
            ],
          }))
        ),
      ],
      sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
    },
    {
      title: "Classic Running Jacket",
      handle: `classic-running-jacket-${HANDLE_SUFFIX}`,
      description: "Lightweight and breathable running jacket designed for performance and style.",
      status: ProductStatus.PUBLISHED,
      thumbnail: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
      images: [
        { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800" },
        { url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800" },
      ],
      category_ids: [outerwear.id, unisex.id, nike.id, running.id],
      metadata: {
        highlights: ["Water-resistant outer shell", "Reflective accents", "Zippered pockets", "Packable design"],
        details: "Material: 100% recycled polyester. Fit: Regular. Machine washable.",
      },
      options: [
        { title: "Size", values: ["S", "M", "L", "XL"] },
        { title: "Color", values: ["Navy", "Black"] },
      ],
      variants: [
        ...["S", "M", "L", "XL"].flatMap((size) =>
          ["Navy", "Black"].map((color) => ({
            title: `${size} / ${color}`,
            sku: `CRJ-${size}-${color.toUpperCase()}`,
            manage_inventory: false,
            options: { Size: size, Color: color },
            prices: [
              { amount: 8500, currency_code: "usd" },
              { amount: 7900, currency_code: "eur" },
            ],
          }))
        ),
      ],
      sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
    },
    {
      title: "Performance Training Tee",
      handle: `performance-training-tee-${HANDLE_SUFFIX}`,
      description: "Engineered for high-intensity workouts with moisture-wicking technology and four-way stretch.",
      status: ProductStatus.PUBLISHED,
      thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      images: [
        { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800" },
        { url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800" },
      ],
      category_ids: [tops.id, unisex.id, nike.id, training.id],
      metadata: {
        highlights: ["Dri-FIT technology", "Four-way stretch fabric", "Flat seams reduce chafing", "Standard fit"],
        details: "Material: 92% polyester, 8% spandex. Machine washable. Imported.",
      },
      options: [
        { title: "Size", values: ["S", "M", "L", "XL", "XXL"] },
        { title: "Color", values: ["White", "Black", "Gray"] },
      ],
      variants: [
        ...["S", "M", "L", "XL", "XXL"].flatMap((size) =>
          ["White", "Black", "Gray"].map((color) => ({
            title: `${size} / ${color}`,
            sku: `PTT-${size}-${color.toUpperCase()}`,
            manage_inventory: false,
            options: { Size: size, Color: color },
            prices: [
              { amount: 3500, currency_code: "usd" },
              { amount: 3200, currency_code: "eur" },
            ],
          }))
        ),
      ],
      sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
    },
    {
      title: "Ultraboost Running Shoe",
      handle: `ultraboost-running-shoe-${HANDLE_SUFFIX}`,
      description: "Our most responsive cushioning ever. Feel the energy return with every stride.",
      status: ProductStatus.PUBLISHED,
      thumbnail: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800",
      images: [
        { url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800" },
        { url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800" },
        { url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800" },
      ],
      category_ids: [runningShoes.id, unisex.id, adidas.id, running.id],
      metadata: {
        highlights: ["Boost midsole for energy return", "Primeknit+ upper", "Continental rubber outsole", "Torsion System"],
        details: "Upper: Primeknit+ textile. Midsole: Boost. Outsole: Continental Rubber. Weight: 310g (size 9).",
      },
      options: [
        { title: "Size", values: ["8", "9", "10", "11", "12"] },
        { title: "Color", values: ["Core Black", "Cloud White"] },
      ],
      variants: [
        ...["8", "9", "10", "11", "12"].flatMap((size) =>
          ["Core Black", "Cloud White"].map((color) => ({
            title: `${size} / ${color}`,
            sku: `UB-${size}-${color.replace(/\s+/g, "").toUpperCase()}`,
            manage_inventory: false,
            options: { Size: size, Color: color },
            prices: [
              { amount: 19000, currency_code: "usd" },
              { amount: 17500, currency_code: "eur" },
            ],
          }))
        ),
      ],
      sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
    },
    {
      title: "Flex Training Shorts",
      handle: `flex-training-shorts-${HANDLE_SUFFIX}`,
      description: "Stretchy, lightweight shorts designed for unrestricted movement during training.",
      status: ProductStatus.PUBLISHED,
      thumbnail: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
      images: [
        { url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800" },
      ],
      category_ids: [bottoms.id, unisex.id, adidas.id, training.id],
      metadata: {
        highlights: ["Elastic waistband with drawcord", "Side pockets", "Mesh ventilation", "Quick-dry fabric"],
        details: "Material: 90% polyester, 10% elastane. Inseam: 7 inches. Machine washable.",
      },
      options: [
        { title: "Size", values: ["S", "M", "L", "XL"] },
      ],
      variants: [
        ...["S", "M", "L", "XL"].map((size) => ({
          title: size,
          sku: `FTS-${size}`,
          manage_inventory: false,
          options: { Size: size },
          prices: [
            { amount: 4500, currency_code: "usd" },
            { amount: 4200, currency_code: "eur" },
          ],
        })),
      ],
      sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
    },
    {
      title: "Sport Duffle Bag",
      handle: `sport-duffle-bag-${HANDLE_SUFFIX}`,
      description: "Spacious duffle bag with separate shoe compartment and water-resistant bottom.",
      status: ProductStatus.PUBLISHED,
      thumbnail: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
      images: [
        { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800" },
      ],
      category_ids: [bags.id, unisex.id, lifestyle.id],
      metadata: {
        highlights: ["50L capacity", "Separate shoe compartment", "Water-resistant base", "Adjustable shoulder strap"],
        details: "Material: 600D polyester. Dimensions: 24\" x 12\" x 12\". Imported.",
      },
      options: [
        { title: "Color", values: ["Black", "Navy"] },
      ],
      variants: [
        ...["Black", "Navy"].map((color) => ({
          title: color,
          sku: `SDB-${color.toUpperCase()}`,
          manage_inventory: false,
          options: { Color: color },
          prices: [
            { amount: 6500, currency_code: "usd" },
            { amount: 5900, currency_code: "eur" },
          ],
        })),
      ],
      sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
    },
    {
      title: "Performance Running Cap",
      handle: `performance-running-cap-${HANDLE_SUFFIX}`,
      description: "Lightweight, moisture-wicking cap with UPF 50+ sun protection for outdoor runs.",
      status: ProductStatus.PUBLISHED,
      thumbnail: "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=800",
      images: [
        { url: "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=800" },
      ],
      category_ids: [hats.id, unisex.id, running.id],
      metadata: {
        highlights: ["UPF 50+ sun protection", "Moisture-wicking sweatband", "Reflective elements", "Adjustable back closure"],
        details: "Material: 100% recycled polyester. One size fits most. Hand wash recommended.",
      },
      options: [
        { title: "Color", values: ["White", "Black"] },
      ],
      variants: [
        ...["White", "Black"].map((color) => ({
          title: color,
          sku: `PRC-${color.toUpperCase()}`,
          manage_inventory: false,
          options: { Color: color },
          prices: [
            { amount: 2800, currency_code: "usd" },
            { amount: 2500, currency_code: "eur" },
          ],
        })),
      ],
      sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
    },
    {
      title: "Compression Leggings",
      handle: `compression-leggings-${HANDLE_SUFFIX}`,
      description: "High-performance compression leggings that support muscles and reduce fatigue during workouts.",
      status: ProductStatus.PUBLISHED,
      thumbnail: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800",
      images: [
        { url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800" },
      ],
      category_ids: [bottoms.id, womens.id, nike.id, training.id],
      metadata: {
        highlights: ["Graduated compression", "Hidden waistband pocket", "Flatlock seams", "4-way stretch"],
        details: "Material: 78% nylon, 22% elastane. Rise: High. Machine washable cold.",
      },
      options: [
        { title: "Size", values: ["XS", "S", "M", "L", "XL"] },
        { title: "Color", values: ["Black", "Dark Gray"] },
      ],
      variants: [
        ...["XS", "S", "M", "L", "XL"].flatMap((size) =>
          ["Black", "Dark Gray"].map((color) => ({
            title: `${size} / ${color}`,
            sku: `CL-${size}-${color.replace(/\s+/g, "").toUpperCase()}`,
            manage_inventory: false,
            options: { Size: size, Color: color },
            prices: [
              { amount: 7500, currency_code: "usd" },
              { amount: 6900, currency_code: "eur" },
            ],
          }))
        ),
      ],
      sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
    },
  ]

  const { result: createdProducts } = await createProductsWorkflow(container).run({
    input: { products: productsData },
  })

  logger.info(`Created ${createdProducts.length} products`)

  for (const product of createdProducts) {
    await link.create({
      [Modules.STORE]: { store_id: STORE_ID },
      [Modules.PRODUCT]: { product_id: product.id },
    })
  }
  logger.info("Linked all products to store")

  const existingJa3 = await (async () => {
    const { data: sp } = await query.graph({
      entity: "store",
      filters: { id: STORE_ID },
      fields: ["products.id", "products.title"],
    })
    return (sp[0]?.products || []).find((p: any) => p.title === "Nike Ja 3")
  })()

  if (existingJa3) {
    logger.info(`Updating Nike Ja 3 (${existingJa3.id}) with faceted categories...`)
    await productModule.updateProducts(existingJa3.id, {
      category_ids: [basketballShoes.id, mens.id, nike.id, basketball.id],
    })
    logger.info("Nike Ja 3 categories updated")
  }

  logger.info("Creating collections...")
  const [runningCollection] = await productModule.createProductCollections([
    { title: "Running", handle: `running-${HANDLE_SUFFIX}`, metadata: { store_id: STORE_ID } },
  ])
  const [trainingCollection] = await productModule.createProductCollections([
    { title: "Training", handle: `training-${HANDLE_SUFFIX}`, metadata: { store_id: STORE_ID } },
  ])
  const [essentialsCollection] = await productModule.createProductCollections([
    { title: "Essentials", handle: `essentials-${HANDLE_SUFFIX}`, metadata: { store_id: STORE_ID } },
  ])

  await link.create({ [Modules.STORE]: { store_id: STORE_ID }, [Modules.PRODUCT]: { product_collection_id: runningCollection.id } })
  await link.create({ [Modules.STORE]: { store_id: STORE_ID }, [Modules.PRODUCT]: { product_collection_id: trainingCollection.id } })
  await link.create({ [Modules.STORE]: { store_id: STORE_ID }, [Modules.PRODUCT]: { product_collection_id: essentialsCollection.id } })
  logger.info("Created and linked 3 collections")

  const airMax = createdProducts.find((p: any) => p.title === "Air Max 90")
  const ultraboost = createdProducts.find((p: any) => p.title === "Ultraboost Running Shoe")
  const jacket = createdProducts.find((p: any) => p.title === "Classic Running Jacket")
  const tee = createdProducts.find((p: any) => p.title === "Performance Training Tee")
  const shorts = createdProducts.find((p: any) => p.title === "Flex Training Shorts")
  const leggings = createdProducts.find((p: any) => p.title === "Compression Leggings")
  const duffle = createdProducts.find((p: any) => p.title === "Sport Duffle Bag")
  const cap = createdProducts.find((p: any) => p.title === "Performance Running Cap")

  const runningProducts = [airMax, ultraboost, jacket, cap].filter(Boolean)
  const trainingProducts = [tee, shorts, leggings].filter(Boolean)
  const essentialProducts = [tee, duffle, cap].filter(Boolean)

  for (const p of runningProducts) {
    await productModule.updateProducts(p.id, { collection_id: runningCollection.id })
  }
  for (const p of trainingProducts) {
    await productModule.updateProducts(p.id, { collection_id: trainingCollection.id })
  }
  for (const p of essentialProducts) {
    if (!trainingProducts.includes(p)) {
      await productModule.updateProducts(p.id, { collection_id: essentialsCollection.id })
    }
  }

  logger.info("Assigned products to collections")
  logger.info("Storefront seed complete!")
}
