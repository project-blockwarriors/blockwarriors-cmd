
import CompetitionContent from './components/CompetitionContent';
import { getSettings } from '@/server/db/home';

export default async function CompetitionPage() {
  const settings = await getSettings();
  return (
    <CompetitionContent
      startTournament={settings?.start_tournament}
      showTopBanner={settings?.show_banner}
      bannerTextContent={settings?.banner_text_content}
      bannerButtonContent={settings?.banner_button_content}
    />
  );
}