import { createClient } from '@/utils/supabase/server';
import { Banner, BannerFormData } from '@/types/banner';

export class BannerService {
  private async getSupabase() {
    return await createClient();
  }

  // Get all active banners
  async getActiveBanners(): Promise<Banner[]> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('position')
      .order('sort_order');

    if (error) {
      console.error('Error fetching banners:', error);
      throw new Error('Failed to fetch banners');
    }

    return data || [];
  }

  // Get banner by position
  async getBannerByPosition(position: string): Promise<Banner | null> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('position', position)
      .eq('is_active', true)
      .order('sort_order')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching banner by position:', error);
      throw new Error('Failed to fetch banner');
    }

    return data;
  }

  // Get banners by position
  async getBannersByPosition(position: string): Promise<Banner[]> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('position', position)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching banners by position:', error);
      throw new Error('Failed to fetch banners');
    }

    return data || [];
  }

  // Create new banner
  async createBanner(bannerData: BannerFormData): Promise<Banner> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('banners')
      .insert([bannerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating banner:', error);
      throw new Error('Failed to create banner');
    }

    return data;
  }

  // Update banner
  async updateBanner(id: string, bannerData: Partial<BannerFormData>): Promise<Banner> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('banners')
      .update(bannerData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating banner:', error);
      throw new Error('Failed to update banner');
    }

    return data;
  }

  // Delete banner
  async deleteBanner(id: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting banner:', error);
      throw new Error('Failed to delete banner');
    }
  }

  // Upload banner image
  async uploadBannerImage(file: File, fileName: string): Promise<string> {
    const supabase = await this.getSupabase();
    
    const fileExt = fileName.split('.').pop();
    const filePath = `banners/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading banner image:', error);
      throw new Error('Failed to upload image');
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  // Delete banner image from storage
  async deleteBannerImage(imageUrl: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Get last two parts (banners/filename.ext)

    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting banner image:', error);
      // Don't throw error as the image might not exist
    }
  }

  // Get banner statistics
  async getBannerStats(): Promise<{ total: number; active: number; byPosition: Record<string, number> }> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('banners')
      .select('position, is_active');

    if (error) {
      console.error('Error fetching banner stats:', error);
      throw new Error('Failed to fetch banner statistics');
    }

    const total = data?.length || 0;
    const active = data?.filter(b => b.is_active).length || 0;
    
    const byPosition: Record<string, number> = {};
    data?.forEach(banner => {
      byPosition[banner.position] = (byPosition[banner.position] || 0) + 1;
    });

    return { total, active, byPosition };
  }

  // Reorder banners
  async reorderBanners(bannerIds: string[]): Promise<void> {
    const supabase = await this.getSupabase();
    
    const updates = bannerIds.map((id, index) => ({
      id,
      sort_order: index + 1
    }));

    const { error } = await supabase
      .from('banners')
      .upsert(updates);

    if (error) {
      console.error('Error reordering banners:', error);
      throw new Error('Failed to reorder banners');
    }
  }
} 