import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/manager
    const { data: dbUser } = await supabaseAdmin!
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!dbUser || !['admin', 'manager'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, table, id, data } = body;

    if (!action || !table) {
      return NextResponse.json({ error: 'Action and table are required' }, { status: 400 });
    }

    switch (action) {
      case 'delete':
        return await handleDelete(table, id);
      
      case 'update':
        return await handleUpdate(table, id, data);
      
      case 'create':
        return await handleCreate(table, data);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin mutation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

async function handleDelete(table: string, id: string) {
  if (!id) {
    return NextResponse.json({ error: 'ID is required for delete operations' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin!
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      return NextResponse.json({ error: `Failed to delete ${table}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${table} deleted successfully`
    });

  } catch (error) {
    console.error(`Error in handleDelete for ${table}:`, error);
    return NextResponse.json({ error: `Failed to delete ${table}` }, { status: 500 });
  }
}

async function handleUpdate(table: string, id: string, data: Record<string, unknown>) {
  if (!id || !data) {
    return NextResponse.json({ error: 'ID and data are required for update operations' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin!
      .from(table)
      .update(data)
      .eq('id', id);

    if (error) {
      console.error(`Error updating ${table}:`, error);
      return NextResponse.json({ error: `Failed to update ${table}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${table} updated successfully`
    });

  } catch (error) {
    console.error(`Error in handleUpdate for ${table}:`, error);
    return NextResponse.json({ error: `Failed to update ${table}` }, { status: 500 });
  }
}

async function handleCreate(table: string, data: Record<string, unknown>) {
  if (!data) {
    return NextResponse.json({ error: 'Data is required for create operations' }, { status: 400 });
  }

  try {
    const { data: newRecord, error } = await supabaseAdmin!
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`Error creating ${table}:`, error);
      return NextResponse.json({ error: `Failed to create ${table}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${table} created successfully`,
      data: newRecord
    });

  } catch (error) {
    console.error(`Error in handleCreate for ${table}:`, error);
    return NextResponse.json({ error: `Failed to create ${table}` }, { status: 500 });
  }
} 