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
      matcher: "/vendors/stores/:id/products/:productId/variants/:variantId/images",
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
  ],
})
