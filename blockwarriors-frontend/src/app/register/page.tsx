import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/register/user-details');
  return null; // Render nothing since the page will redirect immediately
}
