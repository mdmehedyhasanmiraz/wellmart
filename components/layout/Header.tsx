'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { Search, User, ShoppingCart, Menu, ChevronDown, LogOut, Package, UserCheck, ChevronRight } from 'lucide-react';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { getCartCount } = useCart();

  useEffect(() => {
    checkUser();
  }, []);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.category-dropdown')) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    toast.success('Signed out successfully');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('search', searchQuery.trim());
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      router.push(`/shop?${params.toString()}`);
      setIsSearchOpen(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'medicines', name: 'Medicines' },
    { id: 'vitamins', name: 'Vitamins & Supplements' },
    { id: 'personal-care', name: 'Personal Care' },
    { id: 'baby-care', name: 'Baby Care' },
    { id: 'health-devices', name: 'Health Devices' },
    { id: 'first-aid', name: 'First Aid' },
  ];

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Categories', href: '/categories' },
    { name: 'Deals', href: '/deals' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top Row - Logo, Search, Account, Cart */}
      <div className="border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <img 
                  src="/logos/logo-wellmart.png" 
                  alt="Wellmart" 
                  className="h-12 w-auto"
                />
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative flex">
                  {/* Category Dropdown */}
                  <div className="relative category-dropdown">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="flex items-center px-4 py-3 bg-gray-50 border-2 border-r-0 border-lime-500 rounded-l-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-200"
                    >
                      <span className="text-sm text-gray-700 mr-2">
                        {categories.find(cat => cat.id === selectedCategory)?.name || 'All Categories'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    {/* Category Dropdown Menu */}
                    {isCategoryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border-2 border-r-0 border-lime-500 rounded-xl shadow-xl z-50">
                        <div className="py-1">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(category.id);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                selectedCategory === category.id ? 'bg-lime-50 text-lime-700' : 'text-gray-700'
                              }`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-4 pr-12 py-2.5 border-2 border-l-0 border-lime-500 rounded-r-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-200"
                    />
                    <button
                      type="submit"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      <Search className="h-5 w-5 text-lime-500 hover:text-lime-600 transition-colors duration-200" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Side - Account & Cart */}
            <div className="flex items-center space-x-4">
              {/* Search Button - Mobile */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-6 w-6" />
              </button>

              {/* Account */}
              <div className="relative">
                {user ? (
                  <div className="relative group">
                    <button className="flex items-center space-x-1 p-2 text-gray-700 hover:text-gray-900">
                      <User className="h-6 w-6" />
                      <span className="hidden sm:block text-sm font-medium">
                        {user.user_metadata?.name || user.email?.split('@')[0] || 'Account'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Package className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                      <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <Link href="/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Package className="h-4 w-4 mr-2" />
                        Orders
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center space-x-1 p-2 text-gray-700 hover:text-gray-900">
                    <UserCheck className="h-6 w-6" />
                    <span className="hidden sm:block text-sm font-medium">Sign In</span>
                  </Link>
                )}
              </div>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-gray-700 hover:text-gray-900">
                <ShoppingCart className="h-6 w-6" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-lime-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {getCartCount() > 99 ? '99+' : getCartCount()}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search - Overlay */}
      {isSearchOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSearch} className="space-y-3">
              {/* Category Dropdown for Mobile */}
              <div className="relative category-dropdown">
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-2 border-lime-500 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-200"
                >
                  <span className="text-sm text-gray-700">
                    {categories.find(cat => cat.id === selectedCategory)?.name || 'All Categories'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                
                {/* Category Dropdown Menu for Mobile */}
                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-lime-500 rounded-xl shadow-xl z-50">
                    <div className="py-1">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            selectedCategory === category.id ? 'bg-lime-50 text-lime-700' : 'text-gray-700'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Search Input for Mobile */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-4 pr-12 py-3 border-2 border-lime-500 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-200"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <Search className="h-5 w-5 text-lime-500 hover:text-lime-600 transition-colors duration-200" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-lime-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-lime-600 p-2"
              >
                <span className="text-sm font-medium">Menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-lime-600 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
} 