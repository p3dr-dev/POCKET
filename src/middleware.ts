import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;
  const isOnAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');
  const isOnAdminPage = req.nextUrl.pathname.startsWith('/admin');
  const isOnPublicPage = req.nextUrl.pathname === '/';

  // Redirecionar usuário logado para dashboard se tentar acessar login/registro
  if (isOnAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
    return NextResponse.next();
  }

  // Proteção de rotas administrativas
  if (isOnAdminPage) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.nextUrl));
    if (userRole !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Redirecionar usuário não logado para login se tentar acessar rotas protegidas
  if (!isLoggedIn && !isOnPublicPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};