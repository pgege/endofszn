import { defineMiddlewares, authenticate } from "@medusajs/framework/http"
import multer from "multer"

const upload = multer({ storage: multer.memoryStorage() })

export default defineMiddlewares({
  routes: [
    {
      matcher: "/vendors",
      method: "POST",
      middlewares: [
        authenticate("vendor", ["bearer"], {
          allowUnregistered: true,
        }),
      ],
    },
    {
      matcher: "/vendors/me",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/me/*",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/products",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/products/:productId",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/products/:productId/variants",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/products/:productId/variants/:variantId/images",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/products/:productId/options",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/products/:productId/images",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/categories",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/categories/:categoryId",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/categories/templates",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/categories/apply-template",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/bulk-categorize",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/uncategorized-products",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/uploads",
      method: "POST",
      middlewares: [
        authenticate("vendor", ["bearer", "session"]),
        upload.array("files"),
      ],
    },
    {
      matcher: "/vendors/stores/:id/orders",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/orders/:orderId",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/orders/:orderId/*",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/inventory",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/inventory/:itemId",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/customers",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/customers/:customerId",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/promotions",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/promotions/:promotionId",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/collections",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/collections/:collectionId",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/collections/:collectionId/*",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/shipping",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/shipping/:optionId",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/price-lists",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
    {
      matcher: "/vendors/stores/:id/price-lists/:priceListId",
      middlewares: [authenticate("vendor", ["bearer", "session"])],
    },
  ],
})
