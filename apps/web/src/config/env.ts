export const env = {
  WEB_ENV: import.meta.env.VITE_WEB_ENV || 'development',
} as const
