'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { Search, User, ShoppingCart, Menu, ChevronDown, LogOut, Package, UserCheck } from 'lucide-react';
import type { CartItem, GuestCartItem } from '@/types/cart';
import type { Product, Category } from '@/types/product';
import Image from 'next/image';

function CartPanelContent() {
  const { cart, guestCart, loading, updateCartItem, removeFromCart } = useCart();
  const isGuest = !cart;
  const items = isGuest ? guestCart.items : cart?.items || [];
  const total = isGuest ? guestCart.total_price : cart?.total_price || 0;

  function getItemId(item: CartItem | GuestCartItem) {
    return 'id' in item && item.id ? item.id : item.product_id;
  }
  function getProductImage(item: CartItem | GuestCartItem) {
    const product = item.product;
    if (product && Array.isArray((product as any)?.image_urls) && ((product as any)?.image_urls?.length ?? 0) > 0) {
      return (product as any).image_urls[0];
    }
    if (product && typeof (product as any)?.image_url === 'string' && (product as any)?.image_url) {
      return (product as any).image_url;
    }
    return undefined;
  }
  function getProductName(item: CartItem | GuestCartItem) {
    return item.product?.name || 'Product';
  }
  function getProductPrice(item: CartItem | GuestCartItem) {
    const product = item.product;
    if (product && typeof (product as any)?.price_offer !== 'undefined') {
      return (product as any)?.price_offer != null && (product as any)?.price_offer !== 0
        ? (product as any)?.price_offer
        : (product as any)?.price_regular || 0;
    } else if (product && typeof (product as any)?.price !== 'undefined') {
      return (product as any)?.price || 0;
    }
    return 0;
  }
  function getProductTotal(item: CartItem | GuestCartItem) {
    return item.quantity * getProductPrice(item);
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>;
  }
  if (!items.length) {
    return <div className="flex-1 flex flex-col items-center justify-center text-gray-500">Your cart is empty</div>;
  }
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {items.map((item) => (
          <div key={getItemId(item)} className="flex items-center border-b last:border-b-0 pb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {getProductImage(item) ? (
                <img src={getProductImage(item)} alt={getProductName(item)} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 ml-4">
              <h3 className="text-base font-medium text-gray-900 truncate">{getProductName(item)}</h3>
              <p className="text-sm text-gray-500 mb-1">Price: ${getProductPrice(item).toFixed(2)}</p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateCartItem(getItemId(item), item.quantity - 1)}
                  className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateCartItem(getItemId(item), item.quantity + 1)}
                  className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(getItemId(item))}
                  className="ml-4 text-red-600 hover:text-red-800 text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="text-right font-semibold text-base min-w-[60px]">
              ${getProductTotal(item).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t flex flex-col items-end">
        <div className="text-lg font-bold mb-2">Total: ${total.toFixed(2)}</div>
        <button className="px-6 py-2 bg-lime-600 text-white rounded hover:bg-lime-700" onClick={() => alert('Checkout coming soon!')}>Checkout</button>
      </div>
    </div>
  );
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { getCartCount } = useCart();
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  // Fetch categories from Supabase and build tree
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        // Build tree
        const map: { [id: string]: Category & { children: Category[] } } = {};
        data.forEach((cat: Category) => {
          map[cat.id] = { ...cat, children: [] };
        });
        const tree: Category[] = [];
        Object.values(map).forEach(cat => {
          if (cat.parent_id && map[cat.parent_id]) {
            map[cat.parent_id].children.push(cat);
          } else {
            tree.push(cat);
          }
        });
        setCategories(tree);
      }
    }
    fetchCategories();
  }, [supabase]);

  // Recursive render for dropdown
  function renderCategoryDropdown(categories: Category[], level = 0): React.ReactNode[] {
    return categories.map((category) => [
      <button
        key={category.id}
        type="button"
        onClick={() => {
          setSelectedCategory(category.id);
          setIsCategoryDropdownOpen(false);
        }}
        className={`w-full text-left ${level === 0 ? 'px-4' : 'px-8'} py-2 text-sm hover:bg-gray-100 ${
          selectedCategory === category.id ? 'bg-lime-50 text-lime-700' : 'text-gray-700'
        }`}
      >
        {category.name}
      </button>,
      category.children && category.children.length > 0
        ? renderCategoryDropdown(category.children, level + 1)
        : null
    ]);
  }

  // Debounced product search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    const handler = setTimeout(async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price_regular, price_offer, image_urls')
        .ilike('name', `%${searchQuery.trim()}%`)
        .eq('is_active', true)
        .eq('status', 'published')
        .limit(8);
      if (!error && data) {
        setSearchResults(data as unknown as Product[]);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, supabase]);

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
                <Image 
                  src="/logos/logo-wellmart.png" 
                  alt="Wellmart" 
                  className="h-11 w-auto"
                  width={100}
                  height={100}
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
                          {renderCategoryDropdown(categories)}
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
                      onFocus={() => setShowDropdown(!!searchResults.length)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      placeholder="Search products..."
                      className="w-full pl-4 pr-12 py-2.5 border-2 border-l-0 border-lime-500 rounded-r-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-200"
                    />
                    <button
                      type="submit"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      <Search className="h-5 w-5 text-lime-500 hover:text-lime-600 transition-colors duration-200" />
                    </button>
                    {/* Product search dropdown */}
                    {showDropdown && (searchResults.length > 0 || (searchQuery.trim() && !searchLoading)) && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                        {searchLoading ? (
                          <div className="p-4 text-center text-gray-500">Searching...</div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map(product => (
                            <Link
                              key={product.id}
                              href={`/product/${product.slug}`}
                              className="flex items-center px-4 py-2 hover:bg-lime-50 transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <img
                                src={product.image_urls?.[0] || '/images/avatar.png'}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded mr-3 border"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="truncate font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">${(product.price_offer != null && product.price_offer !== 0 ? product.price_offer : product.price_regular).toFixed(2)}</div>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 z-50">
                            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No products found</p>
                            <p className="text-sm">Try a different search term</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Right Side - Account & Cart */}
            <div className="flex items-center space-x-4">
              {/* Search Button - Mobile */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
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
              <button
                type="button"
                className="relative p-2 text-gray-700 hover:text-gray-900"
                onClick={() => setIsCartOpen(true)}
                aria-label="Open cart"
              >
                <ShoppingCart className="h-6 w-6" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-lime-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {getCartCount() > 99 ? '99+' : getCartCount()}
                  </span>
                )}
              </button>

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
                      {renderCategoryDropdown(categories)}
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
                  onFocus={() => setShowDropdown(!!searchResults.length)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
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
                {/* Product search dropdown */}
                {showDropdown && (searchResults.length > 0 || (searchQuery.trim() && !searchLoading)) && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                    {searchLoading ? (
                      <div className="p-4 text-center text-gray-500">Searching...</div>
                    ) : (
                      searchResults.map(product => (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          className="flex items-center px-4 py-2 hover:bg-lime-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <img
                            src={product.image_urls?.[0] || '/images/avatar.png'}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded mr-3 border"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">${(product.price_offer != null && product.price_offer !== 0 ? product.price_offer : product.price_regular).toFixed(2)}</div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cart Side Panel */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="fixed inset-0 backdrop-blur-md transition-opacity" onClick={() => setIsCartOpen(false)} />
          {/* Drawer */}
          <div className="relative ml-auto w-full max-w-md h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <CartPanelContent />
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="bg-white border-b border-gray-200">
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex space-x-8">
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

        {/* Mobile Horizontal Scrollable Navigation */}
        {/* <div className="md:hidden border-t border-gray-100">
          <div className="overflow-x-auto">
            <div className="flex space-x-6 px-4 py-2 min-w-max">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-lime-600 px-2 py-1 text-sm font-medium transition-colors whitespace-nowrap border-b-2 border-transparent hover:border-lime-500"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div> */}
      </nav>
    </header>
  );
} 