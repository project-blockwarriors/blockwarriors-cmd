"use client";

import React, { useState, useEffect } from "react";
import { createContext, useTransition } from "react";
import { Ellipsis, Loader2, CircleUserRound } from "lucide-react";
import { signOutAction } from "@/actions/users";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/auth/client";

const SideBarContext = createContext();

export default function SideBar({ children, setShowNewPost }) {

  const [user, setUser] = useState(null);
  const { auth } = createSupabaseClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [auth]);

  const [isSignoutPending, startSignoutTransition] = useTransition();

  const router = useRouter();

  const signout = () => {
    startSignoutTransition(async () => {
      const { errorMessage } = await signOutAction();

      if (errorMessage) {
        console.error(errorMessage);
        toast.error("An error occurred");
      } else {
        toast.success("Signed out successfully");
        router.push("/");
      }
    });
  };

  const handleProfile = () => {
    router.push("/profile");
  }

  return (
    <aside className="h-screen w-64">
      <nav className="h-full flex flex-col bg-white border-r shadow-sm">
        <div className="pb-2 flex justify-between items-center p-4">
          <div className="flex items-center justify-between">
            <img
              src="/logos/club_logo.png"
              className="w-20 mr-2"
              alt="Princeton TKD Logo"
            />
            <p className="text-md text-center font-semibold leading-5.5 w-100 m-1">
              Princeton Club <br /> Taekwondo
            </p>
          </div>
        </div>

        {/* <SideBarContext.Provider value={{}}>
          <ul className="flex-1 px-3">{children}</ul>
        </SideBarContext.Provider> */}

        <ul className="flex-1 px-3">
            <div className="flex flex-col justify-center">
                <button
                    onClick={() => setShowNewPost(true)}
                    className="my-4 bg-orange-400 text-black font-semibold rounded p-2"
>    
                    New Post
                </button>  
                {children}      
            </div>
        </ul>

        <div className="border-t flex p-3">
          <div className="avatar">
            <div className="ring-primary rounded-full ring-offset-1">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  className="w-8 h-8 rounded-full object-cover"
                  alt={user?.user_metadata?.full_name || "User avatar"}
                />
              ) : (
                <CircleUserRound size={32} className="w-8 h-8" />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center w-full ml-3">
            <div className="leading-5">
              <h4 className="font-semibold text-xs">
                {user?.user_metadata?.full_name || "Anonymous User"}
              </h4>
              <span className="text-xs text-gray-600">
                {user?.email || "No email"}
              </span>
            </div>

            <div className="dropdown dropdown-top dropdown-end relative">
              <label tabIndex={0} className="m-1 cursor-pointer">
                <Ellipsis size={20} className="hover:bg-gray-100 rounded-md" />
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow absolute z-[999] -translate-y-2"
              >
                {/* <li>
                  <a>Profile</a>
                </li> */}
                <li>
                  {/* <a>Edit Profile</a> */}
                  <button onClick={handleProfile}>
                    Edit Profile
                  </button>
                </li>
                <li>
                  <button onClick={signout} disabled={isSignoutPending}>
                    {isSignoutPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Logout"
                    )}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}

export function SideBarItem({ icon, text, active, alert }) {
  return (
    <li
      className={`
                relative flex items-center py-2 px-3 my-1
                font-medium rounded-md cursor-pointer
                transition-colors group
                ${
                  active
                    ? "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
                    : "hover:bg-indigo-50 text-gray-600"
                }
            `}
    >
      <span
        className={`${active ? "text-indigo-800" : "text-black"} w-10 h-10`}
      >
        {icon}
      </span>
      <span className="w-52 ml-3">{text}</span>
      {alert && (
        <div className="absolute right-2 w-2 h-2 rounded bg-indigo-400" />
      )}
    </li>
  );
}