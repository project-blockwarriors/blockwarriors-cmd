'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import type { Id } from '@packages/backend/convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/convex';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Users,
  ArrowLeft,
  Save,
  Shield,
  FileText,
  Crown,
  User,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

export default function EditTeamPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const profile = useQuery(
    api.userProfiles.getUserProfileWithTeamMembers,
    userId ? { userId } : 'skip'
  );

  const updateTeam = useMutation(api.teams.updateTeam);
  const updateTeamImage = useMutation(api.teams.updateTeamImage);
  const deleteTeamImage = useMutation(api.teams.deleteTeamImage);
  const transferLeadership = useMutation(api.teams.transferLeadership);

  const [formData, setFormData] = useState({
    teamName: '',
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string | null>(
    null
  );
  const [isTransferring, setIsTransferring] = useState(false);

  const team = profile?.team;
  const isLeader = team?.leader_id === userId;

  // Initialize form data when team loads
  useEffect(() => {
    if (team) {
      setFormData({
        teamName: team.team_name || '',
        description: team.description || '',
      });
    }
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !team) return;

    setIsSaving(true);
    try {
      const result = await updateTeam({
        teamId: team.id,
        userId,
        teamName: formData.teamName,
        description: formData.description || undefined,
      });

      if (result.success) {
        toast.success('Team updated successfully!');
        router.push('/dashboard/team');
      } else {
        toast.error(result.error || 'Failed to update team.');
      }
    } catch (error) {
      console.error('Failed to update team:', error);
      toast.error('Failed to update team. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransferLeadership = async () => {
    if (!userId || !team || !selectedNewLeader) return;

    const newLeader = team.members?.find(
      (m) => m.user_id === selectedNewLeader
    );
    if (!newLeader) return;

    const confirmMessage = `Are you sure you want to transfer leadership to ${newLeader.first_name} ${newLeader.last_name}?\n\nYou will lose all team management privileges.`;
    if (!confirm(confirmMessage)) return;

    setIsTransferring(true);
    try {
      const result = await transferLeadership({
        teamId: team.id,
        currentLeaderId: userId,
        newLeaderId: selectedNewLeader,
      });

      if (result.success) {
        toast.success('Leadership transferred successfully!');
        router.push('/dashboard/team');
      } else {
        toast.error(result.error || 'Failed to transfer leadership.');
      }
    } catch (error) {
      console.error('Failed to transfer leadership:', error);
      toast.error('Failed to transfer leadership. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Not Logged In</h1>
          <p className="text-muted-foreground mb-4">
            Please log in to edit your team.
          </p>
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

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Team</h1>
          <p className="text-muted-foreground mb-4">
            You&apos;re not on a team.
          </p>
          <Link href="/dashboard/setup/team">
            <Button>Find a Team</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isLeader) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            Only the team leader can edit team settings.
          </p>
          <Link href="/dashboard/team">
            <Button>Back to Team</Button>
          </Link>
        </div>
      </div>
    );
  }

  const otherMembers = team.members?.filter((m) => m.user_id !== userId) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/team">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Team</h1>
          <p className="text-muted-foreground">Update your team settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Image Card */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Team Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ImageUpload
              currentImageUrl={team.team_image_url}
              onUploadComplete={async (storageId: Id<'_storage'>) => {
                await updateTeamImage({
                  teamId: team.id,
                  userId,
                  storageId,
                });
                toast.success('Team logo updated!');
              }}
              onDelete={async () => {
                await deleteTeamImage({ teamId: team.id, userId });
                toast.success('Team logo removed!');
              }}
              type="team"
              size="lg"
            />
            <p className="text-xs text-muted-foreground mt-3">
              Recommended: Square image, at least 200x200 pixels
            </p>
          </CardContent>
        </Card>

        {/* Team Info Card */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Team Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-white">
                Team Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="teamName"
                value={formData.teamName}
                onChange={(e) =>
                  setFormData({ ...formData, teamName: e.target.value })
                }
                placeholder="Your Team Name"
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-white flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Tell others about your team..."
                rows={4}
                className="border-primary/20 focus:border-primary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Max 500 characters.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/team">
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

      {/* Transfer Leadership Card */}
      {otherMembers.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-400">
              <Crown className="h-5 w-5" />
              Transfer Leadership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-400 font-medium">Warning</p>
                <p className="text-sm text-muted-foreground">
                  Transferring leadership will remove your ability to edit team
                  settings and disband the team. This action cannot be easily
                  undone.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Select New Leader</Label>
              <div className="grid grid-cols-1 gap-2">
                {otherMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedNewLeader === member.user_id
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
                    }`}
                    onClick={() => setSelectedNewLeader(member.user_id)}
                  >
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                      {member.profile_image_url ? (
                        <Image
                          src={member.profile_image_url}
                          alt={`${member.first_name} ${member.last_name}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.institution}
                      </p>
                    </div>
                    {selectedNewLeader === member.user_id && (
                      <UserCheck className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
              onClick={handleTransferLeadership}
              disabled={!selectedNewLeader || isTransferring}
            >
              {isTransferring ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-400 border-t-transparent mr-2" />
                  Transferring...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Transfer Leadership
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
