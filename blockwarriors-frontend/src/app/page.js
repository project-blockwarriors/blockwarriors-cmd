"use client";

import DescriptionText from "../app/components/DescriptionText";
import TypedEffect from "../app/components/TypedEffect";
import ImageCarousel from "./components/ImageCarousel";
import GoogleSignInButton from "./components/GoogleSignInButton";
import Image from "next/image";
import { useState } from "react";
import { createSupabaseClient } from "@/auth/client";
import Link from 'next/link';
import ActiveButton from "./components/ActiveButton";

export default function Home() {
  const [user, setUser] = useState(null);
  const { auth } = createSupabaseClient();

  auth.onAuthStateChange((event, session) => {
    setUser(session?.user || null);
  });

  return (
    <div className="flex flex-col justify-center items-center px-10 bg-white">
      <header className="text-center mt-8">
        <div className="absolute top-4 left-4">
          <Image
            src="/logos/club_logo.png"
            alt="Princeton Club Logo"
            width={100}
            height={100}
            className="object-contain"
          />
        </div>

        <div className="typing-container">
          <TypedEffect />
        </div>
        
        <div className="absolute top-4 right-4">
          {user ? (
            <Link href = "/dashboard" passHref>
              <ActiveButton text={"Dashboard"} />
            </Link>
              ) : ""}
        </div>

        <h2 className="text-xl text-gray-700">
          Welcome to Princeton Block Warriors
        </h2>

        <div className="mt-4">
          <ImageCarousel />
        </div>
      </header>

      <div className="mt-4">
        <DescriptionText title="Welcome to Princeton Block Warriors" />
      </div>
      <div className='mt-8 flex justify-center'>
        {!user && <GoogleSignInButton />}
      </div>
    </div>
  );
}
