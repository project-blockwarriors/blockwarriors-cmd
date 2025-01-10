'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ButtonProps } from '@/components/ui/button';

interface ClientButtonProps extends Omit<ButtonProps, 'onClick'> {
  href: string;
}

export default function ClientButton({ href, ...props }: ClientButtonProps) {
  const router = useRouter();
  
  return (
    <Button
      onClick={() => router.push(href)}
      {...props}
    />
  );
}
