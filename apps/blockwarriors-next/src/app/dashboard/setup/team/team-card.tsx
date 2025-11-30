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
    <Card className={`transition-all ${
      isMember 
        ? "border border-primary/50 bg-primary/5" 
        : "border border-white/5 hover:border-primary/30 bg-card/50"
    }`}>
      <CardHeader className="p-5 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white mb-1">{team_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          {isMember && (
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-sm font-normal">
              Your Team
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-2">
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Roster
          </div>
          <div className="space-y-2.5">
            {members.map((member, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  member.user_id === leader_id 
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/30' 
                    : 'bg-white/5 text-white/50'
                }`}>
                  {member.first_name[0]}
                </div>
                <span className={`text-base ${member.user_id === leader_id ? 'text-white font-medium' : 'text-white/60'}`}>
                  {member.first_name} {member.last_name}
                </span>
                {member.user_id === leader_id && (
                  <Crown className="h-4 w-4 text-primary/50 ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
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
