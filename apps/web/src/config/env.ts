const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || 'http'
const API_HOST = import.meta.env.VITE_API_HOST || 'localhost'
const API_PORT = import.meta.env.VITE_API_PORT || '3000'

const buildApiUrl = () => {
  const port = API_PORT ? `:${API_PORT}` : ''
  return `${API_PROTOCOL}://${API_HOST}${port}`
}

export const env = {
  API_PROTOCOL,
  API_HOST,
  API_PORT,
  API_URL: buildApiUrl(),
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
} as const
