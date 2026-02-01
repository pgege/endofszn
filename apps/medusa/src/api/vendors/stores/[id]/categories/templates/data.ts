export interface CategoryNode {
  name: string
  children?: (CategoryNode | string)[]
}

export interface CategoryTemplate {
  id: string
  name: string
  description: string
  structure: CategoryNode[]
}

export const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    id: "fashion",
    name: "Fashion & Apparel",
    description: "Category structure for clothing, footwear, and accessories",
    structure: [
      {
        name: "Categories",
        children: [
          {
            name: "Men's",
            children: [
              {
                name: "Tops",
                children: ["T-Shirts", "Shirts", "Sweaters", "Jackets"],
              },
              {
                name: "Bottoms",
                children: ["Pants", "Shorts", "Jeans"],
              },
              {
                name: "Footwear",
                children: ["Sneakers", "Boots", "Sandals", "Dress Shoes"],
              },
            ],
          },
          {
            name: "Women's",
            children: [
              {
                name: "Tops",
                children: ["Blouses", "T-Shirts", "Sweaters", "Jackets"],
              },
              {
                name: "Bottoms",
                children: ["Pants", "Skirts", "Shorts", "Jeans"],
              },
              {
                name: "Dresses",
                children: ["Casual", "Formal", "Evening"],
              },
              {
                name: "Footwear",
                children: ["Heels", "Flats", "Boots", "Sneakers"],
              },
            ],
          },
          {
            name: "Kids",
            children: ["Boys", "Girls", "Baby"],
          },
          {
            name: "Accessories",
            children: ["Bags", "Jewelry", "Watches", "Hats", "Belts"],
          },
        ],
      },
      {
        name: "Collections",
        children: [],
      },
      {
        name: "Brands",
        children: [],
      },
    ],
  },
  {
    id: "electronics",
    name: "Electronics",
    description: "Category structure for tech products and gadgets",
    structure: [
      {
        name: "Categories",
        children: [
          {
            name: "Computers",
            children: ["Laptops", "Desktops", "Tablets", "Monitors"],
          },
          {
            name: "Phones",
            children: ["Smartphones", "Cases", "Chargers", "Screen Protectors"],
          },
          {
            name: "Audio",
            children: ["Headphones", "Speakers", "Microphones", "Earbuds"],
          },
          {
            name: "Gaming",
            children: ["Consoles", "Games", "Controllers", "Accessories"],
          },
          {
            name: "Accessories",
            children: ["Cables", "Adapters", "Storage", "Power Banks"],
          },
        ],
      },
      {
        name: "Collections",
        children: [],
      },
      {
        name: "Brands",
        children: [],
      },
    ],
  },
  {
    id: "food",
    name: "Food & Beverage",
    description: "Category structure for food, drinks, and grocery items",
    structure: [
      {
        name: "Categories",
        children: [
          {
            name: "Beverages",
            children: ["Coffee", "Tea", "Juices", "Soft Drinks", "Water"],
          },
          {
            name: "Snacks",
            children: ["Chips", "Nuts", "Candy", "Cookies", "Bars"],
          },
          {
            name: "Fresh",
            children: ["Produce", "Dairy", "Meat", "Seafood", "Bakery"],
          },
          {
            name: "Pantry",
            children: ["Canned Goods", "Pasta", "Rice", "Sauces", "Spices"],
          },
        ],
      },
      {
        name: "Collections",
        children: [],
      },
    ],
  },
  {
    id: "general",
    name: "General",
    description: "Basic category structure to get started",
    structure: [
      {
        name: "Categories",
        children: [],
      },
      {
        name: "Collections",
        children: [],
      },
    ],
  },
]

export function getTemplateById(id: string): CategoryTemplate | undefined {
  return CATEGORY_TEMPLATES.find((t) => t.id === id)
}
