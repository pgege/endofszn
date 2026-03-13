export const config = {
  app: {
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },
  medusa: {
    protocol: process.env.MEDUSA_PROTOCOL || 'http',
    host: process.env.MEDUSA_HOST || 'localhost',
    port: process.env.MEDUSA_PORT || '9000',
    get url() {
      return `${this.protocol}://${this.host}:${this.port}`
    },
  },
  store: {
    id: process.env.STORE_ID || '',
  },
} as const
