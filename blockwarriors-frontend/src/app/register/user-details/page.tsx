'use server';

import SignupForm from "../components/SignUpForm";
import { createSupabaseClient } from "@/auth/server";

const RegistrationPage = async () => {

  const supabaseClient = createSupabaseClient();
  const { data: { user } } = await (await supabaseClient).auth.getUser();

  

  return (

    <div className="space-y-8">
      <SignupForm />
      <div className="absolute right-4">
      {user ? `logged in as ${user.email}` : "not logged in"}
      </div>
    </div> 
    
    
  );
}

export default RegistrationPage;