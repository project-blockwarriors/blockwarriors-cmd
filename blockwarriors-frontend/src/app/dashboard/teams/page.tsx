import { TeamCard } from '../../components/TeamCard';

const teams = [
  {
    name: 'Dragon Slayers',
    members: ['Alex Chen', 'Sarah Smith', 'Mike Johnson', 'Emma Davis'],
    wins: 8,
    losses: 2,
  },
  {
    name: 'Nether Knights',
    members: ['James Wilson', 'Lisa Brown', 'David Lee', 'Anna White'],
    wins: 7,
    losses: 3,
  },
  {
    name: 'Emerald Warriors',
    members: ['Tom Miller', 'Rachel Green', 'Chris Black', 'Sophie Taylor'],
    wins: 6,
    losses: 4,
  },
];

export default function TeamsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tournament Teams</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team, i) => (
          <TeamCard key={i} {...team} />
        ))}
      </div>
    </div>
  );
}
