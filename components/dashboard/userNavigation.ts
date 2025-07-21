import { 
  LayoutDashboard, 
  User, 
  ShoppingBag, 
  Search,
  Star
} from 'lucide-react';

export const userNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'My Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Track Order', href: '/track-order', icon: Search },
  { name: 'My Reviews', href: '/reviews', icon: Star },
];