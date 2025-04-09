// lib/auth/nextAuthOptions.ts
import type { NextAuthOptions, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  // Optional: Add callbacks, pages, etc. as needed
  callbacks: {
    async jwt({ token, account }) {
      // If user just signed in, persist accessToken, etc.
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Attach token to session
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  // Add custom pages if needed, e.g.:
  // pages: {
  //   signIn: '/login'
  // },
};
