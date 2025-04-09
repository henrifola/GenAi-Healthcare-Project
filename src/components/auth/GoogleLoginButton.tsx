'use client';
import React from 'react';
import { Button } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';

const GoogleLoginButton = () => {
  return (
    <Button
      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      colorScheme="blue"
      size="lg"
    >
      Sign in with Google
    </Button>
  );
};

export default GoogleLoginButton;
