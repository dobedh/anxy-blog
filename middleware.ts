import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle @username routes by redirecting to /u/username  
  if (pathname.startsWith('/@')) {
    console.log('🔄 Middleware handling @username route:', pathname);
    
    // Extract username (remove the @)
    const username = pathname.slice(2); // Remove /@ 
    
    // Redirect to /u/username
    const url = request.nextUrl.clone();
    url.pathname = `/u/${username}`;
    
    console.log('🔄 Redirecting to:', url.pathname);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
};