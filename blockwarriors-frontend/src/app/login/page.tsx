"use client";

import { loginAction } from "../../actions/users";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import toast from "react-hot-toast";

function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleClickLoginButton = (formData: FormData) => {
    startTransition(async () => {
      const { errorMessage } = await loginAction(formData);
      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.success("Successfully logged in");
        router.push("/");
      }
    });
  };

  return (
      <div className="space-y-8">
        {errorMessage && <div className="text-red-500">{errorMessage}</div>}
        <GoogleSignInButton></GoogleSignInButton>
      </div>
    );
}

export default LoginPage;