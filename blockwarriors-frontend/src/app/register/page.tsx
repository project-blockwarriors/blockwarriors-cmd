import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/register/user-signup');
  return null; // Render nothing since the page will redirect immediately
}
