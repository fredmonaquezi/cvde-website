import { useEffect, useState } from 'react'
import { fetchAdminDashboardData } from '../services/adminService'
import type { ExamCatalogItem, ExamOrder, FaqEntry } from '../types/app'

export function useAdminDashboardData() {
  const [examCatalog, setExamCatalog] = useState<ExamCatalogItem[]>([])
  const [orders, setOrders] = useState<ExamOrder[]>([])
  const [faqEntries, setFaqEntries] = useState<FaqEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)

    const { data, error } = await fetchAdminDashboardData()
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
