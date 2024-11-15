import { Header } from './components/Header';
import { RegistrationBanner } from './components/RegistrationBanner';

export default function Home() {
  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1607988795691-3d0147b43231?auto=format&fit=crop&q=80')] bg-cover bg-center">
      <div className="min-h-screen bg-black/70 backdrop-blur-sm text-white">
        <RegistrationBanner />
        <div className="container mx-auto px-4 py-12">
          <Header />
          <div className="max-w-3xl mx-auto bg-black/40 backdrop-blur-md rounded-lg p-8">
            <h1 className="text-4xl font-bold mb-6 text-white">BlockWarriors AI Challenge</h1>
            <p className="text-lg mb-6 text-gray-200">
              We are excited to announce the BlockWarriors AI Challenge, a unique global competition 
              hosted by Princeton&apos;s E-Club. This event is designed to bring together the brightest 
              minds in computer science to compete in Minecraft-based PvP minigames. Participants will 
              form teams to design and implement algorithms that control a team of four AI bots.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-white">Competition Details</h2>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white">Environment</h3>
                <p className="text-gray-200">Teams will deploy their code in a pre-configured environment. The bots will operate 
                autonomously, receiving a fixed-rate stream of input data including position, health, 
                hunger, and more.</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white">Virtual Qualifier</h3>
                <p className="text-gray-200">Open to all. Teams from around the world are invited to participate in this initial 
                qualifying round.</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white">Finals</h3>
                <p className="text-gray-200">The top 16 student teams will be invited to compete in-person, with a maximum of 4 
                participants per team.</p>
              </div>
            </div>

            <p className="mt-8 text-lg text-gray-200">
              This competition not only tests programming prowess but also strategic thinking in dynamic 
              and challenging scenarios. Join us to showcase your skills and innovate in this exciting event!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}