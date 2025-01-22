import { getSettings } from '@/server/db/home';
import HomeContent from './components/HomeContent';

export default async function Home() {
  const settings = await getSettings();
  
  return <HomeContent 
    startTournament={settings?.start_tournament}
    showTopBanner={settings?.show_banner}
    bannerTextContent={settings?.banner_text_content}
    bannerButtonContent={settings?.banner_button_content}
  />;
}