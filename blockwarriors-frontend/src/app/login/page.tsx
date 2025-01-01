"use client";

import { loginAction } from "../../actions/users";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import toast from "react-hot-toast";

function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  return (
      <div className="space-y-8">
        {errorMessage && <div className="text-red-500">{errorMessage}</div>}
        <GoogleSignInButton></GoogleSignInButton>
      </div>
    );
}

export default LoginPage;