'use client';
import React from 'react';
import { Button } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import { FiUser } from 'react-icons/fi';

const GoogleLoginButton = () => {
  return (
    <Button
      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      colorScheme="blue"
      size="lg"
      leftIcon={<FiUser />}
    >
      Sign in with Google
    </Button>
  );
};

export default GoogleLoginButton;
