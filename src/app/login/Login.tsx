import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import FitbitLoginButton from '@/components/auth/FitbitLoginButton';

const LoginPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();

  // If user is already logged in, redirect to dashboard
  if (session) {
    router.push('/dashboard');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1>Login</h1>
      <FitbitLoginButton />
    </div>
  );
};

export default LoginPage;
