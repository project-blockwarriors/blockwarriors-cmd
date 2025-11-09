'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { joinTeam, leaveTeam, disbandTeam } from '@/server/actions/teams';
import { useRouter } from 'next/navigation';
import { TeamMember, TeamWithUsers } from '@/types/team';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { Users, Crown, UserPlus, LogOut, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'sonner';

interface TeamCardProps extends Omit<TeamWithUsers, 'members'> {
  members: TeamMember[];
  currentUserId: string;
  currentUserTeamId: Id<'teams'> | null;
  hideLeaveButton?: boolean;
}

export function TeamCard({
  id,
  team_name,
  leader_id,
  members,
  currentUserId,
  currentUserTeamId,
  hideLeaveButton,
}: TeamCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isLeader = currentUserId === leader_id;
  const isMember = currentUserTeamId === id;
  const canJoin = !currentUserTeamId && !isMember;

  async function handleJoinTeam() {
    try {
      setIsLoading(true);
      await joinTeam(id, currentUserId);
      router.refresh();
      router.push('/dashboard/setup');
    } catch (error) {
      console.error('Failed to join team:', error);
      toast.error('Failed to join team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLeaveTeam() {
    try {
      setIsLoading(true);
      await leaveTeam(currentUserId);
      router.refresh();
    } catch (error) {
      console.error('Failed to leave team:', error);
      toast.error('Failed to leave team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisbandTeam() {
    try {
      setIsLoading(true);
      await disbandTeam(id, currentUserId);
      router.refresh();
    } catch (error) {
      console.error('Failed to disband team:', error);
      toast.error('Failed to disband team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="hover:bg-accent/5 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{team_name}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Badge>
          </div>
        </div>
        {leader_id && (
          <CardDescription className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Led by {members.find((m) => m.first_name)?.first_name}{' '}
            {members.find((m) => m.last_name)?.last_name}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-1.5">
          {members.map((member, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>
                  {member.first_name} {member.last_name}
                </span>
              </div>
              {member.user_id === leader_id && (
                <Badge variant="outline" className="text-xs">
                  Leader
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {canJoin && (
          <Button
            className="w-full"
            onClick={handleJoinTeam}
            disabled={isLoading}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Join Team
          </Button>
        )}
        {isMember &&
          !hideLeaveButton &&
          (isLeader ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disband Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your team and remove all members from it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisbandTeam}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Disband Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this team? You'll need to
                    rejoin or create a new team to participate in tournaments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveTeam}>
                    Leave Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
      </CardFooter>
    </Card>
  );
}
