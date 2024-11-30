'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ConfirmationPage() {
  const router = useRouter();

  const handleResendEmail = () => {
    // Logic to resend the confirmation email goes here
    alert('A confirmation email has been sent!');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard'); // Redirect to the user dashboard or home page
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <h1 className="text-xl font-semibold">Confirm Your Email</h1>
      <p>
        A confirmation email has been sent to the address you provided. Please
        check your inbox and follow the instructions to confirm your email.
      </p>
      <div className="space-x-4">
        <Button onClick={handleResendEmail}>Resend Email</Button>
        <Button variant="outline" onClick={handleGoToDashboard}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
