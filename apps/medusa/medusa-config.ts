import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import path from 'path'

if (process.env.NODE_ENV !== 'production') {
  const rootDir = path.resolve(__dirname, '../..')
  loadEnv(process.env.NODE_ENV || 'development', rootDir)
}

const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = process.env.REDIS_PORT || '6379'
const redisUrl = `redis://${redisHost}:${redisPort}`

const corsOrigins = process.env.API_CORS_ORIGINS || 'http://localhost:4200'
const databaseUrl = process.env.MEDUSA_DATABASE_URL || process.env.DATABASE_URL
const requiresSsl = databaseUrl?.includes('sslmode=') || process.env.NODE_ENV === 'production'

module.exports = defineConfig({
  admin: {
    disable: process.env.NODE_ENV === 'production',
  },
  projectConfig: {
    databaseUrl,
    databaseDriverOptions: requiresSsl 
      ? { ssl: { rejectUnauthorized: false } } 
      : {},
    redisUrl,
    http: {
      storeCors: corsOrigins,
      adminCors: corsOrigins,
      authCors: corsOrigins,
      jwtSecret: process.env.MEDUSA_JWT_SECRET || 'supersecret',
      cookieSecret: process.env.MEDUSA_COOKIE_SECRET || 'supersecret',
    },
  },
  modules: [
    {
      resolve: '@medusajs/medusa/cache-redis',
      options: {
        redisUrl,
      },
    },
    {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: {
        redisUrl,
      },
    },
    {
      resolve: '@medusajs/medusa/workflow-engine-redis',
      options: {
        redis: {
          redisUrl,
        },
      },
    },
  ],
})
