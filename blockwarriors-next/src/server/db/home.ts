import { createSupabaseClient } from '@/auth/server';
import { cookies } from 'next/headers';

export type Settings = {
  start_tournament: boolean
  show_banner: boolean
  banner_text_content: string
  banner_button_content: string
}

export async function getSettings() {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('settings')
    .select('start_tournament, show_banner, banner_text_content, banner_button_content')
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  return data as Settings;
}
