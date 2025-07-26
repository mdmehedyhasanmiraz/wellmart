import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check if service role key is configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY environment variable is missing',
        timing: Date.now() - startTime
      }, { status: 500 });
    }

    // Check if supabaseAdmin is properly initialized
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'supabaseAdmin client is not properly initialized',
        timing: Date.now() - startTime
      }, { status: 500 });
    }

    // Test basic database operations with service role
    const tests = [];

    // Test 1: Simple products query
    const productsStart = Date.now();
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price_regular')
      .limit(5);
    const productsTiming = Date.now() - productsStart;
    
    tests.push({
      name: 'Products Query',
      success: !productsError,
      error: productsError?.message,
      timing: productsTiming,
      count: products?.length || 0
    });

    // Test 2: Categories query
    const categoriesStart = Date.now();
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug')
      .limit(5);
    const categoriesTiming = Date.now() - categoriesStart;
    
    tests.push({
      name: 'Categories Query',
      success: !categoriesError,
      error: categoriesError?.message,
      timing: categoriesTiming,
      count: categories?.length || 0
    });

    // Test 3: Complex join query (like the one used in products loading)
    const complexStart = Date.now();
    const { data: complexData, error: complexError } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        price_regular,
        price_offer,
        category:categories(name, slug),
        company:companies!products_company_id_fkey(name)
      `)
      .eq('is_active', true)
      .limit(3);
    const complexTiming = Date.now() - complexStart;
    
    tests.push({
      name: 'Complex Join Query',
      success: !complexError,
      error: complexError?.message,
      timing: complexTiming,
      count: complexData?.length || 0
    });

    // Test 4: Check RLS policies
    const rlsStart = Date.now();
    const { data: rlsTest, error: rlsError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(1);
    const rlsTiming = Date.now() - rlsStart;
    
    tests.push({
      name: 'RLS Bypass Test',
      success: !rlsError,
      error: rlsError?.message,
      timing: rlsTiming,
      count: rlsTest?.length || 0
    });

    const totalTiming = Date.now() - startTime;
    const allTestsPassed = tests.every(test => test.success);

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed ? 'Service role key is working correctly' : 'Service role key has issues',
      serviceRoleKeyConfigured: !!serviceRoleKey,
      supabaseAdminInitialized: !!supabaseAdmin,
      tests,
      totalTiming,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Service role test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during service role test',
      details: error instanceof Error ? error.message : 'Unknown error',
      timing: Date.now() - startTime
    }, { status: 500 });
  }
} 