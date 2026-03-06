import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { I18nContext, interpolate, type I18nContextValue } from './context'
import { ptBRMessages } from './messages/pt-BR'

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = 'pt-BR' as const

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, values) => {
        const template = ptBRMessages[key] ?? key
        return interpolate(template, values)
      },
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
