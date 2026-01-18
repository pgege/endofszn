export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
} as const
