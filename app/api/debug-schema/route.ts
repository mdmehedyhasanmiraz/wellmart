import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database service not available' 
      }, { status: 500 });
    }

    const results = {
      tables: {} as any,
      products_schema: null as any,
      manufacturers_table: null as any,
      companies_table: null as any,
      errors: [] as string[]
    };

    // Check if products table exists and get its schema
    try {
      const { data: productsData, error: productsError } = await supabaseAdmin
        .from('products')
        .select('*')
        .limit(1);

      if (productsError) {
        results.errors.push(`Products table error: ${productsError.message}`);
      } else {
        results.products_schema = productsData && productsData.length > 0 ? Object.keys(productsData[0]) : [];
      }
    } catch (error) {
      results.errors.push(`Products table check failed: ${error}`);
    }

    // Check if manufacturers table exists
    try {
      const { data: manufacturersData, error: manufacturersError } = await supabaseAdmin
        .from('manufacturers')
        .select('*')
        .limit(1);

      if (manufacturersError) {
        results.errors.push(`Manufacturers table error: ${manufacturersError.message}`);
      } else {
        results.manufacturers_table = {
          exists: true,
          sample_data: manufacturersData && manufacturersData.length > 0 ? manufacturersData[0] : null
        };
      }
    } catch (error) {
      results.manufacturers_table = { exists: false, error: error };
    }

    // Check if companies table exists
    try {
      const { data: companiesData, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select('*')
        .limit(1);

      if (companiesError) {
        results.errors.push(`Companies table error: ${companiesError.message}`);
      } else {
        results.companies_table = {
          exists: true,
          sample_data: companiesData && companiesData.length > 0 ? companiesData[0] : null
        };
      }
    } catch (error) {
      results.companies_table = { exists: false, error: error };
    }

    // Test products query with manufacturer_id
    try {
      const { data: productsWithManufacturer, error: manufacturerQueryError } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          categories!inner(id, name),
          manufacturers!inner(id, name)
        `)
        .limit(1);

      if (manufacturerQueryError) {
        results.errors.push(`Products with manufacturers query error: ${manufacturerQueryError.message}`);
      } else {
        results.tables.products_with_manufacturers = productsWithManufacturer;
      }
    } catch (error) {
      results.errors.push(`Products with manufacturers query failed: ${error}`);
    }

    // Test products query with company_id
    try {
      const { data: productsWithCompany, error: companyQueryError } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          categories!inner(id, name),
          companies!inner(id, name)
        `)
        .limit(1);

      if (companyQueryError) {
        results.errors.push(`Products with companies query error: ${companyQueryError.message}`);
      } else {
        results.tables.products_with_companies = productsWithCompany;
      }
    } catch (error) {
      results.errors.push(`Products with companies query failed: ${error}`);
    }

    return NextResponse.json({
      success: true,
      schema_info: results
    });

  } catch (error) {
    console.error('Schema debug error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check schema' 
    }, { status: 500 });
  }
} 