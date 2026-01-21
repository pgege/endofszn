import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Outlet />
    </div>
  )
}
