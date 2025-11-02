
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/lib/convex';
import CompetitionContent from './components/CompetitionContent';

export default async function CompetitionPage() {
  const settings = await fetchQuery(api.settings.getSettings, {});
  
  return (
    <CompetitionContent
      startTournament={settings.start_tournament}
      showTopBanner={settings.show_banner}
      bannerTextContent={settings.banner_text_content}
      bannerButtonContent={settings.banner_button_content}
    />
  );
}