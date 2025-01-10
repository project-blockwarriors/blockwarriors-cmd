interface LeaderboardRowProps {
  rank: number;
  name: string;
  elo: number;
  wins: number;
}

export function LeaderboardRow({ rank, name, elo, wins }: LeaderboardRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
      <div className="flex items-center gap-4">
        <span className="font-bold text-lg">#{rank}</span>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{wins} Wins</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold">{elo}</p>
        <p className="text-sm text-muted-foreground">Rating</p>
      </div>
    </div>
  );
}