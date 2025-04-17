// lib/auth/nextAuthOptions.ts
import type { NextAuthOptions, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { jwtDecode } from 'jwt-decode';

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
      userinfo: "https://api.fitbit.com/1/user/-/profile.json",
      profile: (profile: any) => {
        return {
          id: profile.user.encodedId,
          name: `${profile.user.firstName} ${profile.user.lastName}`,
          email: profile.user.email || `${profile.user.encodedId}@fitbit.user`,
          image: profile.user.avatar150 || profile.user.avatar,
        }
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
