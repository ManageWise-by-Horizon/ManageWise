import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Middleware desactivado - la autenticación se maneja en los layouts de cada página
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/profile/:path*", "/login", "/register"],
}
