import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting company:', error);
      return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Company deleted successfully' });

  } catch (error) {
    console.error('Error in delete company API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 