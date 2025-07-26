import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/manager
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!dbUser || !['admin', 'manager'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const categoryId = searchParams.get('category') || '';
    const companyId = searchParams.get('company') || '';
    const statusFilter = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build the query
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        categories!inner(id, name),
        companies!inner(id, name)
      `);

    // Apply filters
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (statusFilter === 'active') {
      query = query.eq('is_active', true);
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedData = data?.map(product => ({
      ...product,
      category_name: product.categories?.name,
      company_name: product.companies?.name
    })) || [];

    return NextResponse.json({
      success: true,
      products: transformedData
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 