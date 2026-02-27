import { useEffect, useState } from 'react'
import type { ExamCatalogItem, ExamOrder, FaqEntry } from '../types/app'
import { fetchVetDashboardData } from '../services/vetService'

export function useVetDashboardData() {
  const [examCatalog, setExamCatalog] = useState<ExamCatalogItem[]>([])
  const [orders, setOrders] = useState<ExamOrder[]>([])
  const [faqEntries, setFaqEntries] = useState<FaqEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)

    const { data, error } = await fetchVetDashboardData()
    if (error || !data) {
      setLoadError(error ?? 'Failed to load data.')
      setIsLoading(false)
      return
    }

    setExamCatalog(data.examCatalog)
    setOrders(data.orders)
    setFaqEntries(data.faqEntries)
    setLoadError(null)
    setIsLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [])

  return {
    examCatalog,
    orders,
    faqEntries,
    isLoading,
    loadError,
    reload,
  }
}
