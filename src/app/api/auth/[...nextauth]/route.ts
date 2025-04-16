import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Local Development',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // For local development, accept any email/password combination
        if (credentials?.email) {
          return {
            id: '1',
            email: credentials.email,
            name: 'Local User',
          };
        }
        return null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // Fitbit OAuth Provider 구현 개선
    {
      id: "fitbit",
      name: "Fitbit",
      type: "oauth",
      // wellKnown 속성 제거 (Fitbit은 이 엔드포인트를 제공하지 않음)
      authorization: {
        url: "https://www.fitbit.com/oauth2/authorize",
        params: { 
          scope: "activity heartrate location nutrition profile settings sleep weight",
          response_type: "code"
        }
      },
      token: {
        url: "https://api.fitbit.com/oauth2/token",
        params: { grant_type: "authorization_code" }
      },
      userinfo: {
        url: "https://api.fitbit.com/1/user/-/profile.json",
        // 응답에서 user 객체를 추출
        async request({ tokens, provider }) {
          try {
            console.log("Requesting Fitbit user info with token");
            const response = await fetch("https://api.fitbit.com/1/user/-/profile.json", {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                'Accept-Language': 'ko_KR',
                'Accept': 'application/json'
              },
            });
            
            if (!response.ok) {
              console.error("Fitbit profile request failed:", response.status, response.statusText);
              throw new Error(`Failed to fetch user profile: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("Fitbit profile data received");
            return data.user;
          } catch (error) {
            console.error("Error fetching Fitbit profile:", error);
            throw error;
          }
        },
      },
      profile(profile) {
        console.log("Processing Fitbit profile");
        
        if (!profile) {
          // 기본 프로필 반환
          return {
            id: 'unknown',
            name: 'Fitbit User',
            email: 'unknown@fitbit.user',
          };
        }
        
        return {
          id: profile.encodedId,
          name: `${profile.firstName} ${profile.lastName}`,
          email: profile.email || `${profile.encodedId}@fitbit.user`,
          image: profile.avatar150 || profile.avatar,
        };
      },
      clientId: process.env.FITBIT_CLIENT_ID || '',
      clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
    },
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // 액세스 토큰과 리프레시 토큰 저장
      if (account && account.access_token) {
        console.log(`Token received for provider: ${account.provider}`);
        
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        
        // expires_at이 존재하면 설정, 없으면 현재 시간에 3600초(1시간) 추가
        token.expiresAt = account.expires_at || Math.floor(Date.now() / 1000) + 3600;
        
        // 디버깅용 로그 (보안정보는 일부만 표시)
        console.log("JWT callback - token updated:", {
          provider: account.provider,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          accessTokenLength: account.access_token?.length,
          expiresAt: token.expiresAt
        });
      }
      
      // 사용자 정보가 있으면 토큰에 추가
      if (user) {
        token.userId = user.id;
      }
      
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      // 세션에 액세스 토큰 추가
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.provider = token.provider;
      session.userId = token.userId;
      
      // 디버깅용 로그
      console.log("Session callback:", {
        provider: token.provider,
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        userId: token.userId
      });
      
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development', // 개발 모드에서만 디버그 활성화
  pages: {
    signIn: '/login',
    error: '/login',  // 에러 발생시 리디렉션할 페이지
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
});

export { handler as GET, handler as POST };
