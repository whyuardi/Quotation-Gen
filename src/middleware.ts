import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";

// Routes that require authentication
const PROTECTED_ROUTES = ["/admin", "/quotations"];

// Routes that should be accessible without auth
const PUBLIC_ROUTES = ["/login", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow print routes without auth (for Puppeteer PDF generation)
  if (pathname.includes("/print")) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    const authenticated = await isAuthenticatedFromRequest(request);

    if (!authenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect root to quotations
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/quotations", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
