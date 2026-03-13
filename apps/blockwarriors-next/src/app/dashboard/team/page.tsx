'use client';

import { useState } from 'react';
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
  Users,
  Edit,
  Trophy,
  Calendar,
  Crown,
  ChevronRight,
  UserMinus,
  Trash2,
  User,
  Shield,
  Target,
  Swords,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const profile = useQuery(
    api.userProfiles.getUserProfileWithTeamMembers,
    userId ? { userId } : 'skip'
  );

  const teamHistory = useQuery(
    api.teams.getTeamTournamentHistory,
    profile?.team?.id ? { teamId: profile.team.id } : 'skip'
  );

  const updateTeamImage = useMutation(api.teams.updateTeamImage);
  const deleteTeamImage = useMutation(api.teams.deleteTeamImage);
  const leaveTeam = useMutation(api.teams.leaveTeam);
  const disbandTeam = useMutation(api.teams.disbandTeam);

  const [isLeaving, setIsLeaving] = useState(false);
  const [isDisbanding, setIsDisbanding] = useState(false);

  const handleLeaveTeam = async () => {
    if (!userId) return;
    if (!confirm('Are you sure you want to leave this team?')) return;

    setIsLeaving(true);
    try {
      await leaveTeam({ userId });
      toast.success('You have left the team.');
    } catch (error: any) {
      console.error('Failed to leave team:', error);
      toast.error(error.message || 'Failed to leave team.');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDisbandTeam = async () => {
    if (!userId || !profile?.team?.id) return;

    const confirmMessage = `Are you sure you want to disband "${profile.team.team_name}"?\n\nThis will:\n• Remove all members from the team\n• Forfeit all active tournament matches\n• Permanently delete the team\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setIsDisbanding(true);
    try {
      const result = await disbandTeam({
        teamId: profile.team.id,
        leaderId: userId,
      });
      if (result.success) {
        toast.success(
          result.forfeitedTournaments
            ? `Team disbanded. ${result.forfeitedTournaments} tournament(s) forfeited.`
            : 'Team disbanded successfully.'
        );
      } else {
        toast.error(result.error || 'Failed to disband team.');
      }
    } catch (error: any) {
      console.error('Failed to disband team:', error);
      toast.error(error.message || 'Failed to disband team.');
    } finally {
      setIsDisbanding(false);
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Not Logged In</h1>
          <p className="text-muted-foreground mb-4">Please log in to view your team.</p>
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

  if (!profile?.team) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Team Yet</h1>
          <p className="text-muted-foreground mb-4">
            Join or create a team to compete in tournaments.
          </p>
          <Link href="/dashboard/setup/team">
            <Button>Find a Team</Button>
          </Link>
        </div>
      </div>
    );
  }

  const team = profile.team;
  const isLeader = team.leader_id === userId;
  const winRate =
    team.team_wins + team.team_losses > 0
      ? Math.round((team.team_wins / (team.team_wins + team.team_losses)) * 100)
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
        <div className="h-32 bg-gradient-to-r from-primary/30 via-blue-500/20 to-purple-500/20" />

        <CardContent className="relative pb-6">
          {/* Team Image */}
          <div className="absolute -top-16 left-8">
            {isLeader ? (
              <ImageUpload
                currentImageUrl={team.team_image_url}
                onUploadComplete={async (storageId) => {
                  await updateTeamImage({
                    teamId: team.id,
                    userId,
                    storageId: storageId as any,
                  });
                  toast.success('Team photo updated!');
                }}
                onDelete={async () => {
                  await deleteTeamImage({ teamId: team.id, userId });
                  toast.success('Team photo removed!');
                }}
                type="team"
                size="lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full overflow-hidden bg-secondary/50 border-2 border-primary/20">
                {team.team_image_url ? (
                  <Image
                    src={team.team_image_url}
                    alt={team.team_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shield className="h-14 w-14 text-muted-foreground" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isLeader ? (
              <>
                <Link href="/dashboard/team/edit">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Team
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  onClick={handleDisbandTeam}
                  disabled={isDisbanding}
                >
                  {isDisbanding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disband
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                onClick={handleLeaveTeam}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Leave Team
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Team Info */}
          <div className="pt-12 pl-44">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{team.team_name}</h1>
              {isLeader && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Your Team
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground mb-4 max-w-2xl">
              {team.description || 'No description set'}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{team.members?.length || 0} members</span>
              </div>
              {team.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-4xl font-bold text-white">{team.team_elo}</p>
            <p className="text-sm text-muted-foreground">ELO Rating</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-4xl font-bold text-white">{team.team_wins}</p>
            <p className="text-sm text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent">
          <CardContent className="pt-6 text-center">
            <Target className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-4xl font-bold text-white">{team.team_losses}</p>
            <p className="text-sm text-muted-foreground">Losses</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="pt-6 text-center">
            <Swords className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <p className="text-4xl font-bold text-white">{winRate}%</p>
            <p className="text-sm text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.members?.map((member) => (
              <div
                key={member.user_id}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  member.user_id === userId
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-secondary/30'
                }`}
              >
                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                  {member.profile_image_url ? (
                    <Image
                      src={member.profile_image_url}
                      alt={`${member.first_name} ${member.last_name}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">
                      {member.first_name} {member.last_name}
                    </p>
                    {member.user_id === team.leader_id && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Leader
                      </Badge>
                    )}
                    {member.user_id === userId && (
                      <Badge variant="outline" className="text-xs text-primary border-primary/30">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.institution}</p>
                </div>

              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tournament History */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Tournament History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamHistory && teamHistory.length > 0 ? (
              <div className="space-y-3">
                {teamHistory.map((tournament) => (
                  <Link
                    key={tournament.tournament_id}
                    href={`/dashboard/tournaments/${tournament.tournament_id}`}
                  >
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-white">{tournament.tournament_name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <Badge
                            variant="outline"
                            className={
                              tournament.status === 'completed'
                                ? 'text-green-400 border-green-400/30'
                                : tournament.status === 'in_progress'
                                  ? 'text-yellow-400 border-yellow-400/30'
                                  : 'text-muted-foreground'
                            }
                          >
                            {tournament.status === 'in_progress'
                              ? 'In Progress'
                              : tournament.status.charAt(0).toUpperCase() +
                                tournament.status.slice(1)}
                          </Badge>
                          <span>
                            {tournament.format === 'round_robin'
                              ? 'Round Robin'
                              : 'Double Elimination'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold">
                            {tournament.matches_won}W
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-400 font-bold">
                            {tournament.matches_played - tournament.matches_won}L
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 ml-auto" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No tournaments yet</p>
                <Link href="/dashboard/tournaments">
                  <Button variant="outline" className="mt-4">
                    Browse Tournaments
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning for in-progress tournaments */}
      {teamHistory && teamHistory.some((t) => t.status === 'in_progress') && isLeader && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-400">Active Tournament Warning</p>
                <p className="text-sm text-muted-foreground">
                  Your team is currently in an active tournament. Disbanding the team will forfeit
                  all remaining matches and give your opponents automatic wins.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
