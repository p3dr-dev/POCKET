import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Schema para validação de login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/login', // Página customizada
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
    }
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          // Buscar usuário no banco (com aspas para Postgres se necessário, mas prisma client resolve)
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Usar JWT é mais simples para escalar
  },
  secret: process.env.AUTH_SECRET, // Precisa adicionar ao .env
});
