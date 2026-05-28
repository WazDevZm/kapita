import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth, useClerk } from '@clerk/react'
import { useAuthStore } from '../store/authStore'
import { setClerkTokenGetter } from '../services/api'
import { isProtectedRoute, isPublicRoute } from '../utils/routes'
import Loading from './Loading'
import ClerkSyncError from './ClerkSyncError'

export default function ClerkAuthBridge({ children }) {
  const location = useLocation()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { signOut } = useClerk()
  const { hydrateSession, logout, setClerkSignOut, sessionLoading, user, error } =
    useAuthStore()

  const onPublicRoute = isPublicRoute(location.pathname)
  const onProtectedRoute = isProtectedRoute(location.pathname)

  useEffect(() => {
    setClerkTokenGetter(() => getToken())
    setClerkSignOut(signOut)
  }, [getToken, signOut, setClerkSignOut])

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      hydrateSession()
      return
    }

    const legacyToken = localStorage.getItem('access_token')
    if (legacyToken) {
      if (!user) {
        hydrateSession()
      }
      return
    }

    logout({ skipClerk: true })
  }, [isLoaded, isSignedIn, hydrateSession, logout, user])

  if (!isLoaded && onProtectedRoute) {
    return <Loading fullScreen message="Loading…" />
  }

  if (isSignedIn && sessionLoading && onProtectedRoute) {
    return <Loading fullScreen message="Setting up your account…" />
  }

  if (isSignedIn && !user && error && !onPublicRoute) {
    return <ClerkSyncError message={error} onRetry={() => hydrateSession()} />
  }

  return children
}
