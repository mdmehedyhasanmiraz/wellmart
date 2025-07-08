# Hero Section Component

## Overview

The Hero Section component provides a dynamic homepage hero with:
- **Sticky Category Sidebar**: Collapsible list of categories and subcategories
- **Dynamic Banner**: Large main banner with configurable content
- **Feature Cards**: Four smaller cards below the main banner
- **Responsive Design**: Works on all screen sizes

## Components

### 1. HeroSection.tsx
Main component that orchestrates the entire hero section.

**Features:**
- Fetches categories and subcategories from database
- Loads banners from Supabase storage
- Handles category expansion/collapse
- Responsive layout with sticky sidebar

### 2. Banner Management

#### Database Schema
```sql
-- Run supabase-banners-schema.sql to create the banners table
```

#### Banner Positions
- `main`: Large hero banner (top)
- `card1`, `card2`, `card3`, `card4`: Feature cards (bottom)

#### Banner Fields
- `title`: Banner title
- `subtitle`: Optional subtitle
- `image_url`: Supabase storage URL
- `link_url`: Optional link destination
- `position`: Banner position
- `is_active`: Show/hide banner
- `sort_order`: Display order

## Setup Instructions

### 1. Database Setup
```bash
# Run the SQL schema in Supabase SQL Editor
supabase-banners-schema.sql
```

### 2. Storage Bucket Setup
1. Create a storage bucket named `images` in Supabase
2. Create a folder `banners` inside the bucket
3. Set bucket policies for public read access

### 3. Upload Banner Images
1. Upload images to `images/banners/` bucket
2. Use descriptive names: `main-banner.jpg`, `card1.jpg`, etc.
3. Recommended sizes:
   - Main banner: 1200x400px
   - Cards: 300x200px

### 4. Insert Banner Records
```sql
-- Example banner insertion
INSERT INTO banners (title, subtitle, image_url, link_url, position, sort_order) 
VALUES (
  'Health & Wellness', 
  'Discover our premium health products', 
  'https://your-project.supabase.co/storage/v1/object/public/images/banners/main-banner.jpg', 
  '/shop?category=vitamins', 
  'main', 
  1
);
```

## Usage

### Basic Usage
```tsx
import HeroSection from '@/components/home/HeroSection';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      {/* Other content */}
    </div>
  );
}
```

### Customization

#### Category Sidebar
- Categories are fetched from the `categories` table
- Subcategories are fetched from the `subcategories` table
- Only active categories are displayed

#### Banner Content
- Banners are managed through the `banners` table
- Images are stored in Supabase storage
- Content is fully configurable through the database

## Features

### Category Sidebar
- **Sticky positioning**: Stays in view while scrolling
- **Collapsible**: Click to expand/collapse categories
- **Subcategory navigation**: Direct links to filtered shop pages
- **Responsive**: Adapts to mobile screens

### Banner Section
- **Dynamic content**: Loaded from database
- **Image optimization**: Uses Next.js Image component
- **Hover effects**: Smooth transitions and scaling
- **Fallback content**: Shows placeholder when no banners exist

### Responsive Design
- **Desktop**: Sidebar + banner layout
- **Mobile**: Stacked layout with mobile-optimized search

## Admin Management

### Banner Management
Admins can manage banners through:
- Database operations
- Supabase dashboard
- Custom admin interface (future)

### Category Management
Categories are managed through:
- Database operations
- Product management system

## Styling

### Color Scheme
- Uses lime green theme (`lime-500`, `lime-600`)
- Consistent with header design
- Accessible color contrast

### Layout
- Grid-based responsive layout
- Sticky sidebar with smooth scrolling
- Modern card design with shadows

## Performance

### Optimization
- Lazy loading of images
- Efficient database queries
- Minimal re-renders with React hooks
- Optimized bundle size

### Caching
- Banner images cached by Supabase CDN
- Category data cached in component state
- Efficient re-fetching strategies

## Troubleshooting

### Common Issues

1. **Banners not loading**
   - Check Supabase storage bucket permissions
   - Verify banner records exist in database
   - Check image URLs are correct

2. **Categories not showing**
   - Ensure categories have `is_active = true`
   - Check database connection
   - Verify RLS policies

3. **Images not displaying**
   - Check storage bucket public access
   - Verify image file paths
   - Check Next.js Image component configuration

### Debug Mode
Enable console logging for debugging:
```tsx
// Add to HeroSection component
console.log('Categories:', categories);
console.log('Banners:', banners);
```

## Future Enhancements

### Planned Features
- Banner carousel/slider
- Category icons
- A/B testing for banners
- Analytics integration
- Admin interface for banner management

### Customization Options
- Custom color themes
- Layout variations
- Animation options
- Content scheduling 