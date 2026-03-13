import type {
  EcommerceProduct,
  EcommerceCategory,
  EcommerceCartItem,
  EcommerceReview,
  EcommerceOrder,
  EcommerceFilter,
  EcommerceSortOption,
  EcommercePromo,
  EcommerceIncentive,
  EcommerceNavigation,
  EcommerceTestimonial,
  EcommerceOffer,
  EcommerceRatingBreakdown,
  EcommerceImage,
  EcommerceColor,
  EcommerceSize,
  EcommerceBreadcrumb,
  EcommerceProductFeature,
} from "@/components/ecommerce/types"

const img = (id: number, w = 800, h = 800) =>
  `https://picsum.photos/id/${id}/${w}/${h}`

export const mockBreadcrumbs: EcommerceBreadcrumb[] = [
  { id: "1", name: "Home", href: "#" },
  { id: "2", name: "Clothing", href: "#" },
]

export const mockImages: EcommerceImage[] = [
  { id: "1", src: img(1, 800, 1000), alt: "Product image 1" },
  { id: "2", src: img(20, 800, 600), alt: "Product image 2" },
  { id: "3", src: img(26, 800, 600), alt: "Product image 3" },
  { id: "4", src: img(30, 800, 1000), alt: "Product image 4" },
]

export const mockColors: EcommerceColor[] = [
  { name: "Black", value: "#111827" },
  { name: "White", value: "#f9fafb" },
  { name: "Navy", value: "#1e3a5f" },
]

export const mockSizes: EcommerceSize[] = [
  { name: "XS", inStock: true },
  { name: "S", inStock: true },
  { name: "M", inStock: true },
  { name: "L", inStock: true },
  { name: "XL", inStock: true },
  { name: "XXL", inStock: false },
]

export const mockProductFull = {
  name: "Basic Tee 6-Pack",
  price: "$192",
  href: "#",
  breadcrumbs: mockBreadcrumbs,
  images: mockImages,
  colors: mockColors,
  sizes: mockSizes,
  rating: 4,
  reviewCount: 117,
  description:
    "The Basic Tee 6-Pack allows you to fully express your vibrant personality with three grayscale options. Embrace the spectrum of neutrality with confidence.",
  highlights: [
    "Hand cut and sewn locally",
    "Dyed with our proprietary colors",
    "Pre-washed & pre-shrunk",
    "Ultra-soft 100% cotton",
  ],
  details:
    'The 6-Pack includes two black, two white, and two heather gray Basic Tees. Sign up for our subscription service and be the first to get new, exciting colors.',
}

export const mockProductOverview02 = {
  ...mockProductFull,
  details: [
    {
      name: "Features",
      items: [
        "Multiple strap configurations",
        "Spacious interior with top zip",
        "Leather handle and target",
        "Removable shoulder strap",
      ],
    },
    {
      name: "Care",
      items: [
        "Spot clean as needed",
        "Hand wash with mild soap",
        "Machine wash cold, gentle cycle",
        "Lay flat to dry",
      ],
    },
    {
      name: "Shipping",
      items: [
        "Free shipping on orders over $300",
        "International shipping available",
        "Expedited shipping options",
        "Signature required upon delivery",
      ],
    },
  ],
}

export const mockProducts: EcommerceProduct[] = Array.from({ length: 8 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Premium Product ${i + 1}`,
  href: "#",
  price: `$${(i + 1) * 35}`,
  originalPrice: i % 3 === 0 ? `$${(i + 1) * 45}` : undefined,
  imageSrc: img(10 + i * 3, 800, 800),
  imageAlt: `Product ${i + 1}`,
  color: ["Black", "White", "Navy", "Gray"][i % 4],
  rating: 3 + (i % 3),
  reviewCount: 20 + i * 12,
  description: `High quality product ${i + 1} with premium materials and modern design.`,
  inStock: i !== 5,
  colors: mockColors,
  sizes: mockSizes,
}))

export const mockCategories: EcommerceCategory[] = [
  {
    id: "cat-1",
    name: "New Arrivals",
    href: "#",
    imageSrc: img(42, 800, 600),
    imageAlt: "New Arrivals",
    description: "Explore the latest styles and trends for the season.",
  },
  {
    id: "cat-2",
    name: "Accessories",
    href: "#",
    imageSrc: img(60, 800, 600),
    imageAlt: "Accessories",
    description: "Complete your look with our curated accessories.",
  },
  {
    id: "cat-3",
    name: "Workspace",
    href: "#",
    imageSrc: img(48, 800, 600),
    imageAlt: "Workspace",
    description: "Upgrade your work setup with modern essentials.",
  },
  {
    id: "cat-4",
    name: "Sale",
    href: "#",
    imageSrc: img(50, 800, 600),
    imageAlt: "Sale",
    description: "Find great deals on premium products.",
  },
  {
    id: "cat-5",
    name: "Footwear",
    href: "#",
    imageSrc: img(55, 800, 600),
    imageAlt: "Footwear",
    description: "Step into comfort and style.",
  },
  {
    id: "cat-6",
    name: "Outerwear",
    href: "#",
    imageSrc: img(65, 800, 600),
    imageAlt: "Outerwear",
    description: "Stay warm and stylish this season.",
  },
]

export const mockCartItems: EcommerceCartItem[] = [
  {
    id: "cart-1",
    name: "Throwback Hip Bag",
    href: "#",
    price: "$90.00",
    quantity: 1,
    imageSrc: img(21, 200, 200),
    imageAlt: "Hip bag",
    color: "Salmon",
    size: "M",
    inStock: true,
  },
  {
    id: "cart-2",
    name: "Medium Stuff Satchel",
    href: "#",
    price: "$32.00",
    quantity: 2,
    imageSrc: img(25, 200, 200),
    imageAlt: "Satchel bag",
    color: "Blue",
    inStock: true,
  },
  {
    id: "cart-3",
    name: "Classic Leather Wallet",
    href: "#",
    price: "$55.00",
    quantity: 1,
    imageSrc: img(29, 200, 200),
    imageAlt: "Leather wallet",
    color: "Brown",
    inStock: false,
  },
]

export const mockReviews: EcommerceReview[] = [
  {
    id: "rev-1",
    author: "Emily Selman",
    avatarSrc: img(64, 100, 100),
    rating: 5,
    date: "January 20, 2026",
    title: "Absolutely love it!",
    content:
      "This is the bag of my dreams. I took it on my last vacation and was able to fit an absurd amount of snacks in it.",
  },
  {
    id: "rev-2",
    author: "Hector Gibbons",
    avatarSrc: img(65, 100, 100),
    rating: 4,
    date: "January 12, 2026",
    title: "Great quality",
    content:
      "Before getting the Ruck Snack, I struggled to find a bag that could hold all my gear without feeling bulky. This bag handles everything with ease.",
  },
  {
    id: "rev-3",
    author: "Mark Edwards",
    avatarSrc: img(67, 100, 100),
    rating: 5,
    date: "December 28, 2025",
    title: "Perfect for everyday use",
    content:
      "I've been using this bag daily for a month now and it still looks brand new. The material quality is outstanding and the stitching is impeccable.",
  },
  {
    id: "rev-4",
    author: "Sarah Palmer",
    avatarSrc: img(91, 100, 100),
    rating: 3,
    date: "December 15, 2025",
    title: "Good but could be better",
    content:
      "Solid construction and great design, but I wish it had one more interior pocket for organization. Still a great purchase overall.",
  },
]

export const mockRatingBreakdown: EcommerceRatingBreakdown[] = [
  { rating: 5, count: 63, percentage: 63 },
  { rating: 4, count: 10, percentage: 10 },
  { rating: 3, count: 6, percentage: 6 },
  { rating: 2, count: 12, percentage: 12 },
  { rating: 1, count: 9, percentage: 9 },
]

export const mockOrders: EcommerceOrder[] = [
  {
    id: "order-1",
    number: "WU88191111",
    date: "January 22, 2026",
    datetime: "2026-01-22",
    status: "Delivered",
    total: "$238.00",
    subtotal: "$210.00",
    tax: "$14.00",
    shippingPrice: "$14.00",
    invoiceHref: "#",
    deliveryDate: "January 28, 2026",
    deliveryDatetime: "2026-01-28",
    shippingAddress: {
      name: "Floyd Miles",
      street: "7363 Cynthia Pass",
      city: "Toronto",
      state: "ON",
      zip: "M5V 3L9",
      country: "Canada",
    },
    billingAddress: {
      name: "Floyd Miles",
      street: "7363 Cynthia Pass",
      city: "Toronto",
      state: "ON",
      zip: "M5V 3L9",
      country: "Canada",
    },
    paymentMethod: "Visa ending in 4242",
    shippingMethod: "DHL Express",
    items: [
      {
        id: "oi-1",
        name: "Micro Backpack",
        href: "#",
        price: "$70.00",
        quantity: 1,
        imageSrc: img(10, 200, 200),
        imageAlt: "Micro Backpack",
        color: "Moss",
        status: "Delivered",
        deliveryDate: "January 28, 2026",
        deliveryDatetime: "2026-01-28",
      },
      {
        id: "oi-2",
        name: "Nomad Tumbler",
        href: "#",
        price: "$35.00",
        quantity: 2,
        imageSrc: img(30, 200, 200),
        imageAlt: "Tumbler",
        status: "Shipped",
        deliveryDate: "February 2, 2026",
        deliveryDatetime: "2026-02-02",
      },
    ],
  },
  {
    id: "order-2",
    number: "AT48441546",
    date: "December 15, 2025",
    datetime: "2025-12-15",
    status: "Shipped",
    total: "$141.00",
    subtotal: "$120.00",
    tax: "$9.00",
    shippingPrice: "$12.00",
    invoiceHref: "#",
    shippingAddress: {
      name: "Floyd Miles",
      street: "7363 Cynthia Pass",
      city: "Toronto",
      state: "ON",
      zip: "M5V 3L9",
    },
    paymentMethod: "Mastercard ending in 8888",
    items: [
      {
        id: "oi-3",
        name: "Leather Long Wallet",
        href: "#",
        price: "$118.00",
        quantity: 1,
        imageSrc: img(22, 200, 200),
        imageAlt: "Long wallet",
        color: "Natural",
        status: "In Transit",
      },
    ],
  },
]

export const mockFilters: EcommerceFilter[] = [
  {
    id: "color",
    name: "Color",
    options: [
      { value: "white", label: "White", checked: false },
      { value: "beige", label: "Beige", checked: false },
      { value: "blue", label: "Blue", checked: true },
      { value: "brown", label: "Brown", checked: false },
      { value: "green", label: "Green", checked: false },
      { value: "purple", label: "Purple", checked: false },
    ],
  },
  {
    id: "category",
    name: "Category",
    options: [
      { value: "new-arrivals", label: "New Arrivals", checked: false },
      { value: "sale", label: "Sale", checked: false },
      { value: "travel", label: "Travel", checked: true },
      { value: "organization", label: "Organization", checked: false },
      { value: "accessories", label: "Accessories", checked: false },
    ],
  },
  {
    id: "size",
    name: "Size",
    options: [
      { value: "2l", label: "2L", checked: false },
      { value: "6l", label: "6L", checked: false },
      { value: "12l", label: "12L", checked: false },
      { value: "18l", label: "18L", checked: false },
      { value: "20l", label: "20L", checked: false },
      { value: "40l", label: "40L", checked: true },
    ],
  },
]

export const mockSortOptions: EcommerceSortOption[] = [
  { name: "Most Popular", href: "#", current: true },
  { name: "Best Rating", href: "#", current: false },
  { name: "Newest", href: "#", current: false },
  { name: "Price: Low to High", href: "#", current: false },
  { name: "Price: High to Low", href: "#", current: false },
]

export const mockPromos: EcommercePromo[] = [
  {
    title: "Summer Collection",
    description: "Discover the latest trends for the warm season.",
    href: "#",
    imageSrc: img(100, 800, 600),
    imageAlt: "Summer collection promo",
    cta: "Shop Now",
  },
  {
    title: "Workspace Essentials",
    description: "Upgrade your home office with our curated picks.",
    href: "#",
    imageSrc: img(180, 800, 600),
    imageAlt: "Workspace promo",
    cta: "Explore",
  },
  {
    title: "Winter Sale",
    description: "Up to 50% off on selected items.",
    href: "#",
    imageSrc: img(160, 800, 600),
    imageAlt: "Winter sale",
    cta: "Shop Sale",
  },
]

export const mockTestimonials: EcommerceTestimonial[] = [
  {
    id: "test-1",
    quote:
      "My order arrived super quickly. The product is even better than I hoped it would be. Very happy customer over here!",
    attribution: "Sarah Peters, New Orleans",
  },
  {
    id: "test-2",
    quote:
      "I had to return a purchase that didn't fit. The whole process was so simple that I ended up ordering two new items!",
    attribution: "Kelly McPherson, Chicago",
  },
]

export const mockOffers: EcommerceOffer[] = [
  {
    name: "Free delivery",
    description: "Free shipping on orders over $100. It's not rocket science.",
    href: "#",
  },
  {
    name: "10% off for new customers",
    description: "Use code WELCOME10 at checkout for 10% off your first order.",
    href: "#",
  },
  {
    name: "Exchange and return",
    description: "If you don't like it, trade it or return it within 30 days.",
    href: "#",
  },
]

export const mockNavigation: EcommerceNavigation = {
  categories: [
    {
      id: "women",
      name: "Women",
      featured: [
        {
          name: "New Arrivals",
          href: "#",
          imageSrc: img(42, 400, 400),
          imageAlt: "New arrivals for women",
        },
        {
          name: "Basic Tees",
          href: "#",
          imageSrc: img(43, 400, 400),
          imageAlt: "Basic tees",
        },
        {
          name: "Accessories",
          href: "#",
          imageSrc: img(44, 400, 400),
          imageAlt: "Accessories",
        },
        {
          name: "Sale",
          href: "#",
          imageSrc: img(45, 400, 400),
          imageAlt: "Sale items",
        },
      ],
      sections: [
        {
          id: "clothing",
          name: "Clothing",
          items: [
            { name: "Tops", href: "#" },
            { name: "Dresses", href: "#" },
            { name: "Pants", href: "#" },
            { name: "Denim", href: "#" },
            { name: "Sweaters", href: "#" },
          ],
        },
        {
          id: "accessories",
          name: "Accessories",
          items: [
            { name: "Watches", href: "#" },
            { name: "Wallets", href: "#" },
            { name: "Bags", href: "#" },
            { name: "Sunglasses", href: "#" },
          ],
        },
      ],
    },
    {
      id: "men",
      name: "Men",
      featured: [
        {
          name: "New Arrivals",
          href: "#",
          imageSrc: img(50, 400, 400),
          imageAlt: "New arrivals for men",
        },
        {
          name: "Basic Tees",
          href: "#",
          imageSrc: img(51, 400, 400),
          imageAlt: "Basic tees for men",
        },
      ],
      sections: [
        {
          id: "clothing",
          name: "Clothing",
          items: [
            { name: "Tops", href: "#" },
            { name: "Pants", href: "#" },
            { name: "Jackets", href: "#" },
          ],
        },
      ],
    },
  ],
  pages: [
    { name: "Company", href: "#" },
    { name: "Stores", href: "#" },
  ],
}

export const mockFeatures: EcommerceProductFeature[] = [
  {
    name: "Durable Construction",
    description:
      "Built with premium materials that stand the test of time. Reinforced stitching and water-resistant coating.",
    imageSrc: img(119, 600, 400),
    imageAlt: "Durable construction detail",
  },
  {
    name: "Ergonomic Design",
    description:
      "Carefully designed for maximum comfort. Padded straps and back panel for all-day wear.",
    imageSrc: img(120, 600, 400),
    imageAlt: "Ergonomic design detail",
  },
  {
    name: "Organized Storage",
    description:
      "Multiple compartments and pockets keep everything in its place. Dedicated laptop sleeve fits up to 15 inches.",
    imageSrc: img(133, 600, 400),
    imageAlt: "Organized storage detail",
  },
  {
    name: "Versatile Style",
    description:
      "Transitions seamlessly from work to weekend. Classic silhouette with modern details.",
    imageSrc: img(139, 600, 400),
    imageAlt: "Versatile style detail",
  },
]

export const mockIncentives: EcommerceIncentive[] = [
  {
    name: "Free shipping",
    description: "Free shipping on orders over $100. It's not rocket science.",
    imageSrc: img(200, 200, 200),
  },
  {
    name: "24/7 Customer Support",
    description: "Our AI chat widget is powered by a naive set of if/else statements.",
    imageSrc: img(201, 200, 200),
  },
  {
    name: "Fast Shopping Cart",
    description: "Look how fast that cart is going. What does this mean for the actual experience? I don't know.",
    imageSrc: img(202, 200, 200),
  },
  {
    name: "Gift Cards",
    description: "Buy them for your friends, but they may not like what you pick for them.",
    imageSrc: img(203, 200, 200),
  },
]
