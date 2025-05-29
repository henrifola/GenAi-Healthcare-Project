// lib/auth/nextAuthOptions.ts
import type { NextAuthOptions, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    expiresAt?: number;
  }
}

export const nextAuthOptions: NextAuthOptions = {
  // JWT 암호화를 위한 비밀키 설정
  secret: process.env.NEXTAUTH_SECRET || 'HARU_CARE_JWT_SECRET_KEY',
  
  // JWT 설정
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30일
  },
  
  providers: [
    // Fitbit OAuth Provider 구현
    {
      id: "fitbit",
      name: "Fitbit",
      type: "oauth",
      authorization: {
        url: "https://www.fitbit.com/oauth2/authorize",
        params: { 
          scope: "activity heartrate location nutrition profile settings sleep weight",
          response_type: "code" 
        }
      },
      token: "https://api.fitbit.com/oauth2/token",
      userinfo: {
        url: "https://api.fitbit.com/1/user/-/profile.json",
        async request({ tokens, provider }) {
          const MAX_RETRIES = 3;
          const RETRY_DELAY_MS = 2000; // 2 seconds

          for (let i = 0; i < MAX_RETRIES; i++) {
            try {
              const response = await fetch((provider.userinfo as any).url, {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                },
              });

              if (response.status === 429) {
                console.warn(`Fitbit API rate limit hit. Retrying in ${RETRY_DELAY_MS / 1000} seconds... (Attempt ${i + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                continue; // Retry
              }

              if (!response.ok) {
                throw new Error(`Failed to fetch user profile from Fitbit: ${response.status} ${response.statusText}`);
              }

              return await response.json();
            } catch (error) {
              console.error(`Error fetching Fitbit user profile (attempt ${i + 1}/${MAX_RETRIES}):`, error);
              if (i === MAX_RETRIES - 1) throw error; // Re-throw if last attempt failed
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
          }
          throw new Error('Failed to fetch user profile from Fitbit after multiple retries.');
        },
      },
      profile: (profile: any) => {
        return {
          id: profile.user.encodedId,
          name: `${profile.user.firstName} ${profile.user.lastName}`,
          email: profile.user.email || `${profile.user.encodedId}@fitbit.user`,
          image: profile.user.avatar150 || profile.user.avatar,
        };
      },
      clientId: process.env.FITBIT_CLIENT_ID || '',
      clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      // 액세스 토큰과 리프레시 토큰 저장
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // 세션에 액세스 토큰 추가
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.provider = token.provider;
      return session;
    },
  },
  pages: {
    signIn: '/login'
  },
  debug: process.env.NODE_ENV === 'development',
};
