import { fetchQuery } from 'convex/nextjs';
import { api } from '@/lib/convex';
import HomeContent from './components/HomeContent';

export default async function Home() {
  // Fetch settings from Convex (public query, no token needed)
  const settings = await fetchQuery(api.settings.getSettings, {});
  
  return <HomeContent 
    startTournament={settings.start_tournament}
    showTopBanner={settings.show_banner}
    bannerTextContent={settings.banner_text_content}
    bannerButtonContent={settings.banner_button_content}
  />;
}