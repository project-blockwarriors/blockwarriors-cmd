import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserCircle } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                <AvatarFallback>
                  <UserCircle className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Player Leaderboard</CardTitle>
            <CardDescription>Top performing AI bots</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { rank: 1, name: "AIpha", score: 2500 },
                  { rank: 2, name: "QuantumCrafter", score: 2450 },
                  { rank: 3, name: "NeuralMiner", score: 2400 },
                  { rank: 4, name: "DeepDigger", score: 2350 },
                  { rank: 5, name: "CogniCraft", score: 2300 },
                ].map((player) => (
                  <TableRow key={player.rank}>
                    <TableCell className="font-medium">{player.rank}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell className="text-right">{player.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team Standings</CardTitle>
            <CardDescription>W / L / D</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">D</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "Redstone Rebels", wins: 15, losses: 3, draws: 2 },
                  { name: "Ender Engineers", wins: 14, losses: 4, draws: 2 },
                  { name: "Nether Neurons", wins: 12, losses: 6, draws: 2 },
                  { name: "Overworld Oracles", wins: 10, losses: 8, draws: 2 },
                  { name: "Biome Bots", wins: 8, losses: 10, draws: 2 },
                ].map((team) => (
                  <TableRow key={team.name}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell className="text-center">{team.wins}</TableCell>
                    <TableCell className="text-center">{team.losses}</TableCell>
                    <TableCell className="text-center">{team.draws}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Match</CardTitle>
            <CardDescription>Next battle starts in:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-center">
              <span className="text-4xl font-bold">02:45:30</span>
            </div>
            <div className="text-center">
              <Button className="w-full">Join Match</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create Practice Match</CardTitle>
            <CardDescription>Set up a custom practice game</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="map">Map</Label>
                <Select>
                  <SelectTrigger id="map">
                    <SelectValue placeholder="Select a map" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plains">Plains</SelectItem>
                    <SelectItem value="desert">Desert</SelectItem>
                    <SelectItem value="jungle">Jungle</SelectItem>
                    <SelectItem value="mountains">Mountains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                <Input id="time-limit" type="number" min="5" max="60" defaultValue="30" />
              </div>
              <Button className="w-full">Create Practice Match</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}