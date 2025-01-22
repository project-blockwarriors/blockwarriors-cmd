'use server';

import { getSettings } from '@/server/db/home';
import LoginContent from './(components)/LoginContent';

export default async function LoginPage() {
  const settings = await getSettings();
  
  return (
    <LoginContent
      startTournament={settings?.start_tournament}
      showTopBanner={settings?.show_banner}
      bannerTextContent={settings?.banner_text_content}
      bannerButtonContent={settings?.banner_button_content}
    />
  );
}
