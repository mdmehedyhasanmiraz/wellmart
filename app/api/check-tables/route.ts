import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface TableCheckResult {
  exists: boolean;
  error: string | null;
  data: unknown;
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase admin client not configured'
      }, { status: 500 });
    }

    const results: Record<string, TableCheckResult> = {};

    // Check if users table exists and is accessible
    try {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1);
      
      results.users_table = {
        exists: !usersError,
        error: usersError?.message || null,
        data: usersData
      };
    } catch (error) {
      results.users_table = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }

    // Check if products table exists and is accessible
    try {
      const { data: productsData, error: productsError } = await supabaseAdmin
        .from('products')
        .select('count')
        .limit(1);
      
      results.products_table = {
        exists: !productsError,
        error: productsError?.message || null,
        data: productsData
      };
    } catch (error) {
      results.products_table = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }

    // Check if companies table exists and is accessible
    try {
      const { data: companiesData, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select('count')
        .limit(1);
      
      results.companies_table = {
        exists: !companiesError,
        error: companiesError?.message || null,
        data: companiesData
      };
    } catch (error) {
      results.companies_table = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }

    // Check if categories table exists and is accessible
    try {
      const { data: categoriesData, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('count')
        .limit(1);
      
      results.categories_table = {
        exists: !categoriesError,
        error: categoriesError?.message || null,
        data: categoriesData
      };
    } catch (error) {
      results.categories_table = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Database tables check completed',
      results: results
    });

  } catch (error) {
    console.error('Check tables error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 