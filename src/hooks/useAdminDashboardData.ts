import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAdminDashboardData } from '../services/adminService'
import type { ExamCatalogItem, ExamOrder, FaqEntry } from '../types/app'

export function useAdminDashboardData() {
  const [examCatalog, setExamCatalog] = useState<ExamCatalogItem[]>([])
  const [orders, setOrders] = useState<ExamOrder[]>([])
  const [faqEntries, setFaqEntries] = useState<FaqEntry[]>([])
  const [driverPhone, setDriverPhone] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    }

    const { data, error } = await fetchAdminDashboardData()
    if (error || !data) {
      setLoadError(error ?? 'Failed to load data.')
      if (showLoading) {
        setIsLoading(false)
      }
      return
    }

    setExamCatalog(data.examCatalog)
    setOrders(data.orders)
    setFaqEntries(data.faqEntries)
    setDriverPhone(data.driverPhone)
    setLoadError(null)
    if (showLoading) {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_orders' }, () => {
        void reload(false)
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [reload])

  return {
    examCatalog,
    orders,
    faqEntries,
    driverPhone,
    isLoading,
    loadError,
    reload,
  }
}
