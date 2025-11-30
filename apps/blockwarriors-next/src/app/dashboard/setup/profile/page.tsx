import { Card } from '@/components/ui/card';
import { getUser } from '@/auth/server';
import { getUserProfile } from '@/server/db/users';
import { ProfileForm, ProfileFormInput } from './profile-form';
import { redirect } from 'next/navigation';
import { User, Sparkles } from 'lucide-react';

export default async function ProfileSetupPage() {
  const authUser = await getUser();
  if (!authUser) {
    redirect('/login');
  }

  const rawProfile = await getUserProfile(authUser.id);

  // Convert null values to empty strings for the form
  const profile: ProfileFormInput = {
    user_id: authUser.id,
    first_name: rawProfile?.first_name ?? '',
    last_name: rawProfile?.last_name ?? '',
    institution: rawProfile?.institution ?? '',
    geographic_location: rawProfile?.geographic_location ?? '',
    team: rawProfile?.team ?? null,
  };

  const isEditing = rawProfile?.first_name && rawProfile?.last_name;

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl p-8 border-primary/10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {isEditing ? 'Edit Profile' : 'Create Profile'}
                </h1>
                {!isEditing && <Sparkles className="h-5 w-5 text-primary" />}
              </div>
              <p className="text-muted-foreground">
                {isEditing 
                  ? 'Update your personal information'
                  : 'Tell us about yourself to get started'}
              </p>
            </div>
          </div>
        </div>
        <ProfileForm initialData={profile} />
      </Card>
    </div>
  );
}
