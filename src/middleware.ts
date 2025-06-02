import { NextRequest, NextResponse } from "next/server";

// Only import Edge-compatible code here! Do NOT import Node.js core modules or Node.js-dependent packages.
import { verifyToken } from "@/lib/auth/jwt";

const protectedRoutes = ["/myaccount"];
const authRoutes = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    if (token) {
      try {
        // Only verify JWT here. Do NOT use Node.js APIs or packages like bcryptjs, speakeasy, etc.
        await verifyToken(token);
        return NextResponse.redirect(new URL("/myaccount", req.url));
      } catch {
        const response = NextResponse.next();
        response.cookies.delete("token");
        return response;
      }
    }
    return NextResponse.next();
  }

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    try {
      // Only verify JWT here. Do NOT use Node.js APIs or packages like bcryptjs, speakeasy, etc.
      await verifyToken(token);
      return NextResponse.next();
    } catch (err) {
      console.error("Token invalid:", err);
      const response = NextResponse.redirect(new URL("/unauthorized", req.url));
      response.cookies.delete("token");
      return response;
    }
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
