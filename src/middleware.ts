import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');
  const isOnPublicPage = req.nextUrl.pathname === '/';

  console.log(`[Middleware] Path: ${req.nextUrl.pathname} | LoggedIn: ${isLoggedIn}`);

  // Redirecionar usuário logado para dashboard se tentar acessar login/registro
  if (isOnAuthPage) {
    if (isLoggedIn) {
      console.log('[Middleware] Redirecting to /dashboard (Already logged in)');
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
    return NextResponse.next();
  }

  // Redirecionar usuário não logado para login se tentar acessar rotas protegidas
  if (!isLoggedIn && !isOnPublicPage) {
    console.log('[Middleware] Redirecting to /login (Protected route)');
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};