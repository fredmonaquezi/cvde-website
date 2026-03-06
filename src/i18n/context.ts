import { createContext } from 'react'

type TranslationValue = string | number
export type TranslationValues = Record<string, TranslationValue>

export type I18nContextValue = {
  locale: 'pt-BR'
  t: (key: string, values?: TranslationValues) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function interpolate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (token, key: string) => {
    const value = values[key]
    return value === undefined ? token : String(value)
  })
}
