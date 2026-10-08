import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons/*, sw.js, manifest.webmanifest
     * - static files with extensions (svg, png, jpg, webp, etc.)
     * - api/keep-alive
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/.*|sw.js|manifest.webmanifest|api/keep-alive|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
};
