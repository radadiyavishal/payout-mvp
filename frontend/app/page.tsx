'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    router.replace(user ? '/payouts' : '/login');
  }, [user, router]);
  return null;
}
