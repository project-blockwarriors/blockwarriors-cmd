interface LeaderboardRowProps {
  rank: number;
  teamId: number;
  elo: number;
}

export function LeaderboardRow({ rank, teamId, elo }: LeaderboardRowProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold w-8">{rank}</span>
        <span className="text-lg">Team {teamId}</span>
      </div>
      <div className="text-lg font-medium">{elo} ELO</div>
    </div>
  );
}
