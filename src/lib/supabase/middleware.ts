import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper to copy refreshed auth cookies onto redirect responses
  const copyCookies = (targetResponse: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((c) => {
      targetResponse.cookies.set(c.name, c.value, c);
    });
    return targetResponse;
  };

  const publicPaths = ['/login', '/callback', '/~offline'];
  const isPublic = publicPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  // Protect API routes: return JSON 401 instead of redirecting to HTML login
  if (!user && request.nextUrl.pathname.startsWith('/api/')) {
    if (request.nextUrl.pathname.startsWith('/api/keep-alive')) {
      return supabaseResponse;
    }
    return copyCookies(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  // Redirect unauthenticated users to login with target ?next= preserved
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return copyCookies(NextResponse.redirect(url));
  }

  // If logged in and visiting /login, redirect to ?next= destination or /today
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone();
    const nextParam = request.nextUrl.searchParams.get('next');
    const safeNext =
      nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
        ? nextParam
        : '/today';
    url.pathname = safeNext;
    url.search = '';
    return copyCookies(NextResponse.redirect(url));
  }

  return supabaseResponse;
}
