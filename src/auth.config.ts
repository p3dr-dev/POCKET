import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
    authorized({ auth, request: { nextUrl } }) {
        // Logic will be handled in middleware function, but this callback is required for edge compatibility in some versions
        return true; 
    }
  },
  providers: [], // Providers are configured in auth.ts for Node.js environment
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
