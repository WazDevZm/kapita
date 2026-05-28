const PUBLIC_PATHS = ['/', '/login', '/register', '/admin/login']

export function isPublicRoute(pathname) {
  return PUBLIC_PATHS.includes(pathname)
}

export function isProtectedRoute(pathname) {
  return pathname.startsWith('/app') || pathname.startsWith('/admin')
}
