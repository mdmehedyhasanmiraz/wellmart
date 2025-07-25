import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Category } from '@/types/product';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Build tree structure
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

    return NextResponse.json({
      success: true,
      categories: tree
    });

  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 