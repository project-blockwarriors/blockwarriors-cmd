'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/convex';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  User,
  ArrowLeft,
  Save,
  MapPin,
  Building2,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const profile = useQuery(
    api.userProfiles.getUserProfile,
    userId ? { userId } : 'skip'
  );

  const updateProfile = useMutation(api.userProfiles.updateUserProfile);
  const updateProfileImage = useMutation(api.userProfiles.updateProfileImage);
  const deleteProfileImage = useMutation(api.userProfiles.deleteProfileImage);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    institution: '',
    geographicLocation: '',
    bio: '',
    discordUsername: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        institution: profile.institution || '',
        geographicLocation: profile.geographic_location || '',
        bio: profile.bio || '',
        discordUsername: profile.discord_username || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    try {
      await updateProfile({
        userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        institution: formData.institution,
        geographicLocation: formData.geographicLocation,
        bio: formData.bio || undefined,
        discordUsername: formData.discordUsername || undefined,
      });

      toast.success('Profile updated successfully!');
      router.push('/dashboard/profile');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Not Logged In</h1>
          <p className="text-muted-foreground mb-4">Please log in to edit your profile.</p>
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <p className="text-muted-foreground">Update your personal information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Card */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ImageUpload
              currentImageUrl={profile?.profile_image_url}
              onUploadComplete={async (storageId) => {
                await updateProfileImage({ userId, storageId: storageId as any });
                toast.success('Profile photo updated!');
              }}
              onDelete={async () => {
                await deleteProfileImage({ userId });
                toast.success('Profile photo removed!');
              }}
              type="profile"
              size="lg"
            />
            <p className="text-xs text-muted-foreground mt-3">
              Recommended: Square image, at least 200x200 pixels
            </p>
          </CardContent>
        </Card>

        {/* Basic Info Card */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white">
                  First Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  required
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white">
                  Last Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution" className="text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Institution <span className="text-primary">*</span>
              </Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Princeton University"
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Geographic Location <span className="text-primary">*</span>
              </Label>
              <Input
                id="location"
                value={formData.geographicLocation}
                onChange={(e) => setFormData({ ...formData, geographicLocation: e.target.value })}
                placeholder="Princeton, NJ"
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
                className="border-primary/20 focus:border-primary resize-none"
              />
              <p className="text-xs text-muted-foreground">Optional. Max 500 characters.</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="discord" className="text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                Discord Username
              </Label>
              <Input
                id="discord"
                value={formData.discordUsername}
                onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                placeholder="username#1234"
                className="border-primary/20 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                For team communication and match coordination
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <Link href="/dashboard/profile">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
