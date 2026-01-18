import { Outlet } from 'react-router-dom'

export default function AppRoot() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}
