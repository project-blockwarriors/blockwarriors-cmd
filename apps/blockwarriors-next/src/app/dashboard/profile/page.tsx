'use client';

import { useQuery, useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/convex';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  User,
  Edit,
  MapPin,
  Building2,
  Users,
  Trophy,
  MessageSquare,
  Crown,
  ChevronRight,
  Calendar,
  Target,
  Shield,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const profile = useQuery(
    api.userProfiles.getUserProfileWithTeamMembers,
    userId ? { userId } : 'skip'
  );

  const updateProfileImage = useMutation(api.userProfiles.updateProfileImage);
  const deleteProfileImage = useMutation(api.userProfiles.deleteProfileImage);

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Not Logged In</h1>
          <p className="text-muted-foreground mb-4">Please log in to view your profile.</p>
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

  if (profile === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">Let&apos;s set up your profile.</p>
          <Link href="/dashboard/setup/profile">
            <Button>Create Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`;
  const isTeamLeader = profile.team?.leader_id === userId;
  const teamTies = profile.team?.team_ties ?? 0;
  const winRate = profile.team
    ? profile.team.team_wins + profile.team.team_losses + teamTies > 0
      ? Math.round(
          ((profile.team.team_wins + teamTies * 0.5) /
            (profile.team.team_wins + profile.team.team_losses + teamTies)) *
            100
        )
      : 0
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <Card className="border-primary/10 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/30 via-purple-500/20 to-pink-500/20" />

        <CardContent className="relative pb-6">
          {/* Profile Image */}
          <div className="absolute -top-16 left-8">
            <ImageUpload
              currentImageUrl={profile.profile_image_url}
              onUploadComplete={async (storageId) => {
                await updateProfileImage({ userId, storageId: storageId as any });
              }}
              onDelete={async () => {
                await deleteProfileImage({ userId });
              }}
              type="profile"
              size="lg"
            />
          </div>

          {/* Edit Button */}
          <div className="absolute top-4 right-4">
            <Link href="/dashboard/profile/edit">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>

          {/* Profile Info */}
          <div className="pt-12 pl-44">
            <h1 className="text-3xl font-bold text-white mb-1">{fullName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                <span>{profile.institution}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{profile.geographic_location}</span>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-4 text-muted-foreground max-w-2xl">{profile.bio}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-indigo-400" />
                  </div>
                  <span className="text-muted-foreground">Discord</span>
                </div>
                <span className="font-medium text-white">
                  {profile.discord_username || 'Not set'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {profile.team && (
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-secondary/30">
                    <p className="text-3xl font-bold text-primary">{profile.team.team_elo}</p>
                    <p className="text-xs text-muted-foreground">Team ELO</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/30">
                    <p className="text-3xl font-bold text-white">{winRate}%</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/30">
                    <p className="text-3xl font-bold text-green-400">{profile.team.team_wins}</p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/30">
                    <p className="text-3xl font-bold text-red-400">{profile.team.team_losses}</p>
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Team */}
        <div className="lg:col-span-2">
          <Card className="border-primary/10 h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Your Team
                </div>
                {profile.team && (
                  <Link href="/dashboard/team">
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.team ? (
                <div className="space-y-6">
                  {/* Team Header */}
                  <div className="flex items-start gap-4">
                    {profile.team.team_image_url ? (
                      <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-secondary/50">
                        <Image
                          src={profile.team.team_image_url}
                          alt={profile.team.team_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield className="h-10 w-10 text-primary" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white">{profile.team.team_name}</h3>
                        {isTeamLeader && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <Crown className="h-3 w-3 mr-1" />
                            Leader
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">
                        {profile.team.description || 'No description set'}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-primary">
                          <Trophy className="h-4 w-4" />
                          <span>{profile.team.team_elo} ELO</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{profile.team.members?.length || 0} members</span>
                        </div>
                        {profile.team.created_at && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Created {new Date(profile.team.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Team Members</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profile.team.members?.map((member) => (
                        <div
                          key={member.user_id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            member.user_id === userId
                              ? 'bg-primary/10 border border-primary/20'
                              : 'bg-secondary/30'
                          }`}
                        >
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-secondary">
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">
                                {member.first_name} {member.last_name}
                              </p>
                              {member.user_id === profile.team?.leader_id && (
                                <Crown className="h-3 w-3 text-amber-400 flex-shrink-0" />
                              )}
                              {member.user_id === userId && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 text-primary border-primary/30"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.institution}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Not on a Team</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Join or create a team to compete in tournaments.
                  </p>
                  <Link href="/dashboard/setup/team">
                    <Button>Find a Team</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
