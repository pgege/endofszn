import { Link, useLocation, useMatch } from 'react-router-dom'
import {
  LayoutDashboard, Store, FlaskConical, Package, FolderTree, Settings, Eye,
  ShoppingCart, Warehouse, Users, Percent, FolderOpen, DollarSign, Truck, MapPin,
} from 'lucide-react'
import { paths } from '@/config/paths'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar'

const mainNav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: paths.app.root.getHref() },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Workflows', icon: FlaskConical, href: paths.app.workflows.playground.getHref() },
]

const storeSubNav = [
  { label: 'Overview', icon: Eye, path: '' },
  { label: 'Orders', icon: ShoppingCart, path: '/orders' },
  { label: 'Products', icon: Package, path: '/products' },
  { label: 'Categories', icon: FolderTree, path: '/categories' },
  { label: 'Collections', icon: FolderOpen, path: '/collections' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Inventory', icon: Warehouse, path: '/inventory' },
  { label: 'Promotions', icon: Percent, path: '/promotions' },
  { label: 'Shipping', icon: Truck, path: '/shipping' },
  { label: 'Price Lists', icon: DollarSign, path: '/price-lists' },
  { label: 'Locations', icon: MapPin, path: '/stock-locations' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

export function AppSidebar() {
  const location = useLocation()
  const storeMatch = useMatch('/stores/:id/*')
  const storeId = storeMatch?.params.id

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const isActive =
                  item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {storeId && (
          <>
            <SidebarSeparator />
            <StoreSubNav storeId={storeId} pathname={location.pathname} />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  )
}

function StoreSubNav({ storeId, pathname }: { storeId: string; pathname: string }) {
  const basePath = `/stores/${storeId}`

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Store</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {storeSubNav.map((item) => {
            const fullPath = `${basePath}${item.path}`
            const isActive = item.path === ''
              ? pathname === basePath
              : pathname.startsWith(fullPath)

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                  <Link to={fullPath}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
