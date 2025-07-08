# Wellmart Shop Components

This document describes the modern, reusable product archive components for the Wellmart e-commerce platform.

## Components Overview

### 1. ProductCard (`components/shop/ProductCard.tsx`)
A modern product card component with:
- **Hover effects** with image scaling and overlay actions
- **Discount badges** with percentage calculation
- **Stock status** indicators
- **Quick action buttons** (View Details, Add to Wishlist)
- **Responsive design** with proper spacing
- **Price display** with regular and offer prices
- **Product metadata** (category, manufacturer, dosage form, pack size)

### 2. ProductFilters (`components/shop/ProductFilters.tsx`)
A comprehensive filtering component with:
- **Search functionality** across name, generic name, and SKU
- **Category filter** dropdown
- **Manufacturer filter** dropdown
- **Price range** inputs (min/max)
- **Stock filter** checkbox
- **Sorting options** (name, price, newest)
- **Collapsible design** with active filter indicators
- **Clear filters** functionality

### 3. ProductArchive (`components/shop/ProductArchive.tsx`)
The main product archive component that:
- **Combines filters and product grid**
- **Handles data fetching** from Supabase
- **Implements pagination** (12 items per page)
- **Supports grid/list view modes**
- **Shows loading states** and empty states
- **Manages filter state** and URL parameters
- **Responsive layout** with sidebar filters

### 4. Shop Page (`app/shop/page.tsx`)
The main shop page that:
- **Uses ProductArchive component**
- **Handles cart/wishlist actions**
- **Provides navigation to product details**

## Features

### ✅ **Modern UI Design**
- Clean, shadow-based design
- Smooth hover animations
- Responsive grid layouts
- Professional color scheme

### ✅ **Advanced Filtering**
- Real-time search
- Multiple filter criteria
- Price range selection
- Stock availability filter
- Category and manufacturer filters

### ✅ **Product Display**
- High-quality product cards
- Discount and stock badges
- Quick action buttons
- Comprehensive product information

### ✅ **User Experience**
- Loading states
- Empty states
- Pagination
- View mode toggle
- Smooth animations

### ✅ **Performance**
- Efficient data fetching
- Pagination for large datasets
- Optimized image loading
- Debounced search

## Database Schema

The components work with the following Supabase tables:

### Products Table
```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  generic_name text,
  dosage_form text,
  pack_size text,
  sku text not null unique,
  price_regular numeric(10,2) not null,
  price_offer numeric(10,2),
  stock integer not null default 0,
  image_urls text[] not null,
  description text not null,
  category_id uuid references categories(id) on delete set null,
  manufacturer_id uuid references manufacturers(id) on delete set null,
  brand_id uuid references manufacturers(id) on delete set null,
  status product_status not null default 'draft',
  is_active boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Categories Table
```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references categories(id) on delete set null,
  created_at timestamp with time zone default now()
);
```

### Manufacturers Table
```sql
create table manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text,
  website text,
  created_at timestamp with time zone default now()
);
```

## Setup Instructions

### 1. Database Setup
Run the following SQL in your Supabase SQL editor:

1. **Product Status Enum:**
```sql
create type product_status as enum ('draft', 'published');
```

2. **Tables and Triggers:**
```sql
-- Run the complete schema from your existing tables
-- Make sure to include the has_admin_access function
```

3. **RLS Policies:**
```sql
-- Enable RLS on all tables
-- Create appropriate policies for read/write access
```

### 2. Environment Variables
Ensure your `.env.local` has the required Supabase variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Component Usage

#### Basic Usage
```tsx
import ProductArchive from '@/components/shop/ProductArchive';

export default function ShopPage() {
  return (
    <ProductArchive
      onAddToCart={(product) => console.log('Add to cart:', product)}
      onAddToWishlist={(product) => console.log('Add to wishlist:', product)}
      onViewDetails={(product) => console.log('View details:', product)}
    />
  );
}
```

#### With Initial Filters
```tsx
<ProductArchive
  initialFilters={{
    category_id: 'some-category-id',
    min_price: 100,
    max_price: 500,
    in_stock: true
  }}
  // ... other props
/>
```

## Customization

### Styling
The components use Tailwind CSS classes and can be customized by:
- Modifying the className props
- Creating custom CSS classes
- Using Tailwind's configuration

### Functionality
Extend the components by:
- Adding new filter options
- Implementing cart/wishlist functionality
- Adding product comparison features
- Implementing advanced search

### Data Fetching
Customize data fetching by:
- Modifying the Supabase queries
- Adding caching strategies
- Implementing real-time updates
- Adding search suggestions

## File Structure
```
wellmart/
├── components/shop/
│   ├── ProductCard.tsx          # Individual product card
│   ├── ProductFilters.tsx       # Filtering component
│   └── ProductArchive.tsx       # Main archive component
├── app/shop/
│   └── page.tsx                 # Shop page
├── types/
│   └── product.ts               # TypeScript types
├── supabase-admin-access.sql    # Admin access function
└── SHOP_COMPONENTS.md           # This documentation
```

## Performance Considerations

1. **Image Optimization:** Use Next.js Image component for production
2. **Pagination:** Implement infinite scroll for better UX
3. **Caching:** Add Redis or similar for frequently accessed data
4. **Search:** Consider implementing full-text search with Postgres
5. **CDN:** Use CDN for product images

## Future Enhancements

- [ ] Product comparison feature
- [ ] Advanced search with filters
- [ ] Product recommendations
- [ ] Wishlist functionality
- [ ] Shopping cart integration
- [ ] Product reviews and ratings
- [ ] Inventory tracking
- [ ] Bulk operations for admin
- [ ] Export functionality
- [ ] Analytics integration 