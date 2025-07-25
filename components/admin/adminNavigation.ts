import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Image, 
  BarChart3,
  Star,
  Building2,
  FolderOpen,
  Ticket,
  Code,
  Settings
} from 'lucide-react';

export const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Package },
  { name: 'Companies', href: '/admin/companies', icon: Building2 },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Reviews', href: '/admin/reviews', icon: Star, adminOnly: true },
  { name: 'Banners', href: '/admin/banners', icon: Image },
  { name: 'Media', href: '/admin/media', icon: FolderOpen },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, adminOnly: true },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Code Snippets', href: '/admin/code-snippets', icon: Code, adminOnly: true },
  { name: 'Site Settings', href: '/admin/site-settings', icon: Settings, adminOnly: true },
]; 