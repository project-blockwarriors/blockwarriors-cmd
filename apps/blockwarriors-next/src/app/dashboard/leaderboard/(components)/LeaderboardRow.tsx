interface LeaderboardRowProps {
  rank: number;
  name: string;
  elo: number;
  wins: number;
}

export function LeaderboardRow({ rank, name, elo, wins }: LeaderboardRowProps) {
  const isTopThree = rank <= 3;
  const rankColors = {
    1: 'from-primary to-primary/70 text-black',
    2: 'from-gray-300 to-gray-400 text-black',
    3: 'from-amber-600 to-amber-700 text-white',
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg transition-all ${
      isTopThree 
        ? 'bg-primary/5 border border-primary/20 hover:border-primary/40' 
        : 'bg-secondary/50 border border-transparent hover:border-primary/20'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold ${
          isTopThree 
            ? `bg-gradient-to-br ${rankColors[rank as 1 | 2 | 3]}` 
            : 'bg-secondary text-muted-foreground'
        }`}>
          {rank}
        </div>
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-sm text-primary/70">{wins} Wins</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-xl ${isTopThree ? 'text-primary' : 'text-white'}`}>{elo}</p>
        <p className="text-sm text-muted-foreground">Rating</p>
      </div>
    </div>
  );
}