import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_NAME = 'admin_session'
const COOKIE_VALUE = 'authenticated'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login') return NextResponse.next()

  if (pathname.startsWith('/admin')) {
    const cookie = request.cookies.get(COOKIE_NAME)
    if (cookie?.value !== COOKIE_VALUE) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/admin/:path*'],
}
