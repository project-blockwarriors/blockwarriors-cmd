import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { getUser } from '@/auth/server';
import { getUserProfile } from '@/actions/users';
import { ProfileForm } from './profile-form';
import { UserProfile } from '@/types/user';

export default async function ProfileSetupPage() {
  const authUser = await getUser();
  if (!authUser) {
    redirect('/login');
  }

  const rawProfile = await getUserProfile(authUser.id);

  // Convert null values to empty strings for the form
  const profile: UserProfile = {
    user_id: authUser.id,
    first_name: rawProfile.first_name ?? '',
    last_name: rawProfile.last_name ?? '',
    institution: rawProfile.institution ?? '',
    geographic_location: rawProfile.geographic_location ?? '',
    team: rawProfile.team ?? null,
  };

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Welcome to BlockWarriors! 🚀
          </h1>
          <p className="text-muted-foreground">
            Tell us about yourself to personalize your experience
          </p>
        </div>
        <ProfileForm initialData={profile} />
      </Card>
    </div>
  );
}
