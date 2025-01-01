import SignupForm from "../components/SignUpForm";
import { getUser } from "@/auth/server";

const RegistrationPage = async () => {

  const user = await getUser();
  console.log(user);

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