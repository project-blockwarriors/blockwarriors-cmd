'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createOrUpdateProfile, createProfileFromAuthUser, getUserProfile } from '@/server/actions/users';
import { createTeam, joinTeam, getAvailableTeams } from '@/server/actions/teams';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';

type SetupStep = 'personal' | 'team';

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupStep>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Array<{ _id: Id<"teams">; teamName: string; memberCount: number }>>([]);

  // Personal info state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [institution, setInstitution] = useState('');

  // Team state
  const [teamChoice, setTeamChoice] = useState<'create' | 'join'>('create');
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user?.id) {
          router.push('/login');
          return;
        }
        
        const authUserId = session.data.user.id;
        setUserId(authUserId);
        
        // Get existing profile and prefill form
        const profile = await getUserProfile(authUserId);
        if (profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          setInstitution(profile.institution || '');
        }
      } catch (error) {
        console.error('Error getting user:', error);
        router.push('/login');
      }
    };
    getCurrentUser();
  }, [router]);

  useEffect(() => {
    // Load available teams when on team step
    if (currentStep === 'team' && userId) {
      loadAvailableTeams();
    }
  }, [currentStep, userId]);

  const loadAvailableTeams = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const teams = await getAvailableTeams(userId);
      setAvailableTeams(teams || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load available teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    if (!userId) {
      toast.error('User not found');
      return;
    }

    setIsLoading(true);
    try {
      await createOrUpdateProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        institution: institution.trim() || null,
      });
      setCurrentStep('team');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('User not found');
      return;
    }

    setIsLoading(true);
    try {
      if (teamChoice === 'create') {
        if (!newTeamName.trim()) {
          toast.error('Team name is required');
          setIsLoading(false);
          return;
        }
        await createTeam(userId, newTeamName.trim());
        toast.success('Team created successfully!');
      } else {
        if (!selectedTeamId) {
          toast.error('Please select a team to join');
          setIsLoading(false);
          return;
        }
        await joinTeam(userId, selectedTeamId);
        toast.success('Team joined successfully!');
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete team setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card className="bg-black/40 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-gray-400">
            {currentStep === 'personal' 
              ? 'Step 1 of 2: Personal Information' 
              : 'Step 2 of 2: Team Setup'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 'personal' ? (
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-black/40 border-white/20 text-white"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-black/40 border-white/20 text-white"
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-gray-300 mb-2">
                  Institution
                </label>
                <Input
                  id="institution"
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="bg-black/40 border-white/20 text-white"
                  placeholder="Enter your institution (optional)"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Continue to Team Setup'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleTeamSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Choose an option:
                </label>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teamChoice"
                      value="create"
                      checked={teamChoice === 'create'}
                      onChange={(e) => setTeamChoice(e.target.value as 'create')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-300">Create a new team</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teamChoice"
                      value="join"
                      checked={teamChoice === 'join'}
                      onChange={(e) => setTeamChoice(e.target.value as 'join')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-300">Join an existing team</span>
                  </label>
                </div>
              </div>

              {teamChoice === 'create' ? (
                <div>
                  <label htmlFor="teamName" className="block text-sm font-medium text-gray-300 mb-2">
                    Team Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="teamName"
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="bg-black/40 border-white/20 text-white"
                    placeholder="Enter team name"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum 4 members per team
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select a Team
                  </label>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : availableTeams.length === 0 ? (
                    <p className="text-gray-400 text-sm p-4 bg-black/20 rounded">
                      No available teams to join. All teams are full or you're already in a team.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableTeams.map((team) => (
                        <label
                          key={team._id}
                          className={`flex items-center space-x-3 p-3 rounded border cursor-pointer transition-colors ${
                            selectedTeamId === team._id
                              ? 'bg-blue-500/20 border-blue-500'
                              : 'bg-black/20 border-white/10 hover:bg-black/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedTeam"
                            value={team._id}
                            checked={selectedTeamId === team._id}
                            onChange={() => setSelectedTeamId(team._id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <span className="text-white font-medium">{team.teamName}</span>
                            <span className="text-gray-400 text-sm ml-2">
                              ({team.memberCount}/4 members)
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('personal')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || (teamChoice === 'join' && !selectedTeamId)}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

