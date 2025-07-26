import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get all categories
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, description, parent_id, image_url')
      .order('name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Get all subcategories (categories with parent_id)
    const { data: subcategories, error: subError } = await supabase
      .from('categories')
      .select('id, name, slug, description, category_id:parent_id, image_url')
      .not('parent_id', 'is', null)
      .order('name');

    if (subError) {
      console.error('Error fetching subcategories:', subError);
      return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
    }

    // Group subcategories by parent
    const subcategoriesByParent = subcategories?.reduce((acc: Record<string, SubCategory[]>, sub: any) => {
      if (sub.category_id) {
        if (!acc[sub.category_id]) {
          acc[sub.category_id] = [];
        }
        acc[sub.category_id].push({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          category_id: sub.category_id
        });
      }
      return acc;
    }, {} as Record<string, SubCategory[]>) || {};

    // Build the final categories array
    const processedCategories = allCategories?.map((category: any) => ({
      ...category,
      subcategories: subcategoriesByParent[category.id] || []
    })).filter((category: any) => 
      // Show categories that either have subcategories OR are not subcategories themselves
      category.subcategories.length > 0 || !category.parent_id
    ) || [];

    return NextResponse.json({ categories: processedCategories });
  } catch (error) {
    console.error('Error in categories API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 