import { fetchQuery } from 'convex/nextjs';
import { api } from '@/lib/convex';
import { getToken } from '@/lib/auth-server';

export type Settings = {
  start_tournament: boolean
  show_banner: boolean
  banner_text_content: string | null
  banner_button_content: string | null
}

export async function getSettings(): Promise<Settings | null> {
  try {
    const token = await getToken();
    if (!token) {
      console.error('No auth token available');
      return null;
    }

    const settings = await fetchQuery(
      api.settings.getSettings,
      {},
      { token }
    );

    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}
