import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  fetchProfileByUserId,
  getCurrentSession,
  signOutCurrentUser,
  subscribeToAuthChanges,
} from '../services/authService'
import type { Profile } from '../types/app'

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const { data } = await getCurrentSession()
      if (!mounted) {
        return
      }

      const currentSession = data
      setSession(currentSession)

      if (currentSession?.user) {
        const profileResult = await fetchProfileByUserId(currentSession.user.id)
        if (mounted) {
          setProfile(profileResult.data)
        }
      } else {
        setProfile(null)
      }

      if (mounted) {
        setIsLoading(false)
      }
    }

    void initialize()

    const {
      data: { subscription },
    } = subscribeToAuthChanges((_event, nextSession) => {
      setSession(nextSession)

      if (!nextSession?.user) {
        setProfile(null)
        return
      }

      void fetchProfileByUserId(nextSession.user.id).then((profileResult) => {
        setProfile(profileResult.data)
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await signOutCurrentUser()
  }

  const defaultPath = useMemo(() => {
    if (!session) {
      return '/login'
    }

    if (profile?.role === 'admin_user') {
      return '/admin'
    }

    return '/app'
  }, [profile?.role, session])

  return {
    session,
    profile,
    isLoading,
    signOut,
    setProfile,
    defaultPath,
  }
}
