# Next.js Template

A feature-based Next.js application with Prisma, TypeScript, and Tailwind CSS.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Development](#development)
- [Database & Prisma](#database--prisma)
- [Adding Features](#adding-features)
- [Best Practices](#best-practices)
- [Tech Stack](#tech-stack)

## Features

- ✨ Feature-based architecture
- 🗄️ Prisma ORM with multi-schema support
- 🎨 Tailwind CSS v4
- 📱 Responsive design with dark mode
- 🔒 Type-safe with TypeScript
- 🧩 Reusable UI components (shadcn/ui)
- 📏 ESLint with architecture rules

## Quick Start

### Prerequisites

- Node.js 20+
- Yarn 4.x
- PostgreSQL database (for Prisma schemas)

### Setup

1. **Install dependencies:**
```bash
yarn install
```

2. **Add your Prisma schemas** (see "How to Add a New Database Schema" below)

3. **Start development:**
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

## For AI/LLM Development

See [LLM_DEVELOPMENT_PROMPT.md](./LLM_DEVELOPMENT_PROMPT.md) for a comprehensive guide tailored for AI assistants working with this repository. It covers:
- Multi-schema Prisma database access patterns
- How to check existing databases and add new ones
- Server vs Client component patterns
- Feature-based architecture rules
- Complete workflow examples

## Docker Example

The `docker-example/` directory contains example files for deploying this template with Docker. **These files are not part of the main application** - they're provided as a reference for deployment elsewhere.

See [docker-example/README.md](./docker-example/README.md) for details.

## Project Structure

```
├── app/              # Next.js App Router (routes & pages)
├── components/       # Shared UI components
├── config/           # Global configuration
├── features/         # Feature modules (⭐ most code goes here)
│   └── blog/        # Example feature
│       ├── api/        # Data fetching
│       ├── components/ # UI components
│       └── types/      # TypeScript types
├── hooks/           # Shared React hooks
├── lib/             # Configured libraries (Prisma, utils)
├── prisma/          # Database schema and seeds
├── types/           # Shared TypeScript types
└── utils/           # Shared utilities
```

### Folder Purpose

| Folder | Purpose | Can Import From |
|--------|---------|-----------------|
| `app/` | Routes and pages | Features, Shared |
| `features/` | Business logic | Shared only |
| `components/` | Shared UI | Nothing (shared layer) |
| `lib/` | Libraries | Nothing (shared layer) |
| `hooks/` | Shared hooks | Nothing (shared layer) |
| `types/` | Shared types | Nothing (shared layer) |

## Architecture

### Core Principles

1. **Feature-Based Organization** - Each feature is self-contained
2. **Unidirectional Code Flow** - `shared → features → app`
3. **No Cross-Feature Imports** - Compose at app level
4. **Server Components First** - Client components only when needed

### Code Flow Diagram

```
┌─────────────────────────────────┐
│      APP LAYER (Routes)         │
│   - Pages and route handlers    │
│   - Composes features           │
└────────────┬────────────────────┘
             │ imports from ↓
┌─────────────────────────────────┐
│     FEATURES LAYER              │
│   - Self-contained modules      │
│   - No cross-feature imports    │
└────────────┬────────────────────┘
             │ imports from ↓
┌─────────────────────────────────┐
│      SHARED LAYER               │
│   - components, hooks, lib      │
│   - Reusable across app         │
└─────────────────────────────────┘
```

### Feature Structure

Each feature contains:

```
features/my-feature/
├── api/         # Server-side data fetching, server actions
├── components/  # Feature-specific UI components
├── types/       # TypeScript types for this feature
├── hooks/       # Feature-specific hooks (optional)
└── utils/       # Feature-specific utilities (optional)
```

### Import Rules

✅ **Allowed:**
```tsx
// App can import from features and shared
import { BlogList } from "@/features/blog/components/blog-list"
import { Button } from "@/components/ui/button"

// Features can import from shared
import { cn } from "@/lib/utils"
import type { ApiResponse } from "@/types/common.types"
```

❌ **Not Allowed:**
```tsx
// Cross-feature imports
import { UserCard } from "@/features/users/components/user-card"

// Features importing from app
import { metadata } from "@/app/layout"

// Shared importing from features
import { BlogList } from "@/features/blog/components/blog-list"
```

### Server vs Client Components

**Server Component (default):**
```tsx
// app/blog/page.tsx
import { getBlogs } from "@/features/blog/api/get-blogs"

export default async function BlogPage() {
  const blogs = await getBlogs()
  return <BlogList blogs={blogs} />
}
```

**Client Component:**
```tsx
// features/blog/components/interactive-card.tsx
"use client"

import { useState } from "react"

export function InteractiveCard() {
  const [liked, setLiked] = useState(false)
  return <button onClick={() => setLiked(!liked)}>❤️</button>
}
```

## Development

### Scripts

```bash
# Development
yarn dev              # Start dev server
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run ESLint

# Database
yarn db:generate      # Generate Prisma Client
yarn db:push          # Push schema to database
yarn db:migrate       # Create and run migrations
yarn db:seed          # Seed database
yarn db:studio        # Open Prisma Studio
```

### Configuration

All configuration is centralized in `config/env.ts` - no `.env` files needed:

- **Database URLs:** `config/env.ts` (database section)
- **App config:** `config/env.ts` (app section)
- **Database registry:** `lib/databases.ts` (imports from config)

## Database & Prisma

### Current Setup

This project uses **multiple Prisma schemas** - each database can have different tables/models.

**Structure:**
```
prisma/
└── blogs/
    └── schema.prisma    # User, Blog models

lib/
├── prisma.ts            # Database clients
├── databases.ts         # Export clients
└── generated/
    └── prisma-blogs/    # Generated TypeScript client
```

**Usage:**
```typescript
import { blogs } from "@/lib/databases"

const blogPosts = await blogs.blog.findMany()
```

### How to Add a New Database Schema

**Step 1: Create schema directory**
```bash
mkdir -p prisma/analytics
```

**Step 2: Create schema file** (`prisma/analytics/schema.prisma`)
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../lib/generated/prisma-analytics"
}

datasource db {
  provider = "postgresql"
  url      = "postgresql://placeholder"
}

model PageView {
  id        String   @id @default(cuid())
  path      String
  timestamp DateTime @default(now())
}
```

**Step 3: Add database URL** (`config/env.ts`)
```typescript
export const config = {
  database: {
    blogs: "postgresql://...",
    analytics: "postgresql://...",  // Add this
  },
}
```

**Step 4: Create database client** (`lib/prisma.ts`)
```typescript
import { PrismaClient as BlogsClient } from './generated/prisma-blogs'
import { PrismaClient as AnalyticsClient } from './generated/prisma-analytics'  // Add
import { config } from '@/config/env'

export const blogsDb = new BlogsClient({
  datasources: { db: { url: config.database.blogs } }
})

// Add this
export const analyticsDb = new AnalyticsClient({
  datasources: { db: { url: config.database.analytics } }
})
```

**Step 5: Export database** (`lib/databases.ts`)
```typescript
export { blogsDb as blogs, analyticsDb as analytics } from './prisma'
```

**Step 6: Update scripts** (`package.json`)
```json
{
  "scripts": {
    "db:generate": "prisma generate --schema=./prisma/blogs/schema.prisma && prisma generate --schema=./prisma/analytics/schema.prisma",
    "db:push": "prisma db push --schema=./prisma/blogs/schema.prisma && prisma db push --schema=./prisma/analytics/schema.prisma"
  }
}
```

**Step 7: Generate and use**
```bash
yarn db:generate

# Use in your code
import { analytics } from "@/lib/databases"
const views = await analytics.pageView.findMany()
```

**That's it!** Each database has its own schema and TypeScript types.


### Common Prisma Patterns

**Query with relations:**
```typescript
const blog = await prisma.blog.findUnique({
  where: { id: "123" },
  include: { author: true }
})
```

**Transactions:**
```typescript
await prisma.$transaction([
  prisma.blog.create({ data: blogData }),
  prisma.user.update({ where: { id }, data: userData })
])
```

**Pagination:**
```typescript
const blogs = await prisma.blog.findMany({
  skip: (page - 1) * limit,
  take: limit
})
```

**Select specific fields:**
```typescript
const blogs = await prisma.blog.findMany({
  select: {
    id: true,
    title: true,
    excerpt: true
  }
})
```

## Adding Features

### Step-by-Step

1. **Create folder structure:**
```bash
mkdir -p features/my-feature/{api,components,types}
```

2. **Add ESLint rule** in `eslint.config.mjs`:
```javascript
{
  target: "./features/my-feature",
  from: "./features",
  except: ["./my-feature"],
}
```

3. **Create feature files:**

```typescript
// features/my-feature/types/my-feature.types.ts
export type MyData = {
  id: string
  name: string
}

// features/my-feature/api/get-data.ts
import prisma from "@/lib/prisma"

export async function getData() {
  return await prisma.myData.findMany()
}

// features/my-feature/components/my-component.tsx
import type { MyData } from "../types/my-feature.types"

export function MyComponent({ data }: { data: MyData[] }) {
  return <div>{/* UI */}</div>
}
```

4. **Use in app:**
```typescript
// app/my-page/page.tsx
import { getData } from "@/features/my-feature/api/get-data"
import { MyComponent } from "@/features/my-feature/components/my-component"

export default async function MyPage() {
  const data = await getData()
  return <MyComponent data={data} />
}
```

### Example: Blog Feature

The `features/blog/` folder demonstrates:
- Data fetching: `api/get-blogs.ts`
- Components: `components/blog-card.tsx`, `blog-list.tsx`
- Types: `types/blog.types.ts`
- Usage: `app/page.tsx`

## Best Practices

### Architecture

✅ **Do:**
- Keep features independent and self-contained
- Start with Server Components by default
- Define types within features
- Use meaningful, descriptive names
- Import directly (no barrel exports)
- Compose features at app level

❌ **Don't:**
- Import across features
- Use barrel exports (`index.ts`)
- Put business logic in shared folders
- Mix feature code with shared code
- Create circular dependencies

### TypeScript

✅ **Define feature types:**
```typescript
// features/blog/types/blog.types.ts
export type Blog = {
  id: string
  title: string
  published: boolean
}
```

❌ **Don't export Prisma types:**
```typescript
// ❌ Bad
import type { Blog } from "@/lib/generated/prisma"
export type { Blog }

// ✅ Good - define your own
export type Blog = { /* ... */ }
```

### Components

- Use `kebab-case.tsx` for files
- One component per file
- Client components only when needed (hooks, events, browser APIs)
- Shared components in `/components`
- Feature components in `/features/*/components`

### Data Fetching

- Keep data fetching in `features/*/api/`
- Use Server Components for database access
- Separate data fetching from UI logic
- Handle errors appropriately

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | `kebab-case.tsx` | `blog-card.tsx` |
| Utilities | `kebab-case.ts` | `format-date.ts` |
| Types | `*.types.ts` | `blog.types.ts` |
| Hooks | `use-*.ts` | `use-blog.ts` |
| API | Descriptive | `get-blogs.ts` |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL 16
- **ORM:** Prisma 6.6
- **UI Components:** Radix UI + shadcn/ui
- **Package Manager:** Yarn 4 (node_modules)

## Database Setup

### Local Development

Configure your database connections in `config/env.ts`:

**Example configurations:**

Local PostgreSQL:
```typescript
database: {
  blogs: "postgresql://postgres:password@localhost:5432/blogs_db?schema=public"
}
```

Supabase:
```typescript
database: {
  blogs: "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
}
```

Neon:
```typescript
database: {
  blogs: "postgresql://[user]:[password]@[endpoint].neon.tech/blogs_db?sslmode=require"
}
```

### Prisma Commands

```bash
yarn db:push          # Push schema (development)
yarn db:migrate       # Create migration (production)
yarn db:seed          # Seed database
yarn db:studio        # Open Prisma Studio GUI
yarn db:generate      # Generate Prisma Client
```

## Code Quality

### ESLint Rules

Architecture enforced via ESLint:
- No cross-feature imports
- Features cannot import from app
- Shared cannot import from features/app
- Unidirectional code flow

### TypeScript

- Strict mode enabled
- Path aliases configured (`@/*`)
- All files must be typed
- No `any` types

## Troubleshooting

### ESLint Errors

If you see import restriction errors:
1. Check if you're importing across features
2. Move shared code to `/components`, `/lib`, or `/utils`
3. Compose features at app level

### Prisma Issues

- Run `yarn db:generate` after schema changes
- Verify database URLs in `lib/databases.ts`
- Ensure database is accessible and credentials are correct

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Regenerate Prisma Client: `yarn db:generate`
- Check TypeScript errors: `yarn build`

## Contributing

1. Follow the feature-based architecture
2. Keep features independent
3. Use TypeScript for all files
4. Follow existing naming conventions
5. Test your changes

## License

MIT
