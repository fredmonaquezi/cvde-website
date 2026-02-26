import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'

type UserRole = 'vet_user' | 'admin_user'
type VetTab = 'order' | 'history' | 'prices' | 'faq'
type AdminTab = 'orders' | 'prices' | 'faq'
type OrderStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

type Profile = {
  id: string
  full_name: string | null
  role: UserRole
}

type ExamCatalogItem = {
  id: number
  name: string
  description: string | null
  current_price: number
  active: boolean
}

type SelectedExam = {
  exam_id: number
  exam_name: string
  unit_price: number
  quantity: number
  line_total: number
}

type ExamOrder = {
  id: number
  vet_id: string
  vet_name_snapshot: string | null
  vet_email_snapshot: string | null
  owner_name: string
  owner_phone: string | null
  owner_email: string | null
  patient_name: string
  species: string
  breed: string | null
  age_years: number | null
  sex: string | null
  clinical_notes: string | null
  selected_exams: SelectedExam[]
  total_value: number
  status: OrderStatus
  scheduled_for: string | null
  admin_notes: string | null
  created_at: string
}

type FaqEntry = {
  id: number
  question: string
  answer: string
  category: string | null
  active: boolean
}

type OrderEdit = {
  status: OrderStatus
  scheduled_for: string
  admin_notes: string
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function parseSelectedExams(value: unknown): SelectedExam[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (
        typeof item === 'object' &&
        item !== null &&
        'exam_id' in item &&
        'exam_name' in item &&
        'unit_price' in item &&
        'quantity' in item &&
        'line_total' in item
      ) {
        return item as SelectedExam
      }
      return null
    })
    .filter((item): item is SelectedExam => item !== null)
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status status-${status}`}>{status.replace('_', ' ')}</span>
}

function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (error) {
        setMessage(error.message)
      } else if (!data.session) {
        setMessage('Account created. Check your email to confirm login.')
      } else {
        setMessage('Account created and logged in.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Login successful.')
      }
    }

    setLoading(false)
  }

  return (
    <main className="page">
      <section className="card auth-card">
        <h1>CVDE Platform</h1>
        <p className="muted">
          {mode === 'login' ? 'Login to continue.' : 'Create your veterinarian account.'}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Auth mode">
          <button
            className={mode === 'login' ? 'tab active' : 'tab'}
            type="button"
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={mode === 'signup' ? 'tab active' : 'tab'}
            type="button"
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label>
              Full name
              <input
                required
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Dr. Jane Smith"
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@clinic.com"
            />
          </label>

          <label>
            Password
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
            />
          </label>

          <button disabled={loading} type="submit">
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>

        {message ? <p className="message">{message}</p> : null}
      </section>
    </main>
  )
}

function VetDashboard({
  profile,
  session,
  onSignOut,
}: {
  profile: Profile
  session: Session
  onSignOut: () => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<VetTab>('order')
  const [examCatalog, setExamCatalog] = useState<ExamCatalogItem[]>([])
  const [orders, setOrders] = useState<ExamOrder[]>([])
  const [faqEntries, setFaqEntries] = useState<FaqEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [patientName, setPatientName] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [ageYears, setAgeYears] = useState('')
  const [sex, setSex] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({})

  const loadData = async () => {
    setIsLoading(true)

    const [{ data: examData, error: examError }, { data: orderData, error: orderError }, { data: faqData, error: faqError }] =
      await Promise.all([
        supabase.from('exam_catalog').select('id, name, description, current_price, active').eq('active', true).order('name'),
        supabase.from('exam_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('faq_entries').select('id, question, answer, category, active').eq('active', true).order('id', { ascending: false }),
      ])

    if (examError || orderError || faqError) {
      setMessage(examError?.message ?? orderError?.message ?? faqError?.message ?? 'Failed to load data.')
      setIsLoading(false)
      return
    }

    const parsedOrders = (orderData ?? []).map((item) => ({
      ...item,
      selected_exams: parseSelectedExams(item.selected_exams),
    })) as ExamOrder[]

    setExamCatalog((examData ?? []) as ExamCatalogItem[])
    setOrders(parsedOrders)
    setFaqEntries((faqData ?? []) as FaqEntry[])
    setIsLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [])

  const selectedExams = examCatalog
    .filter((exam) => selectedQuantities[exam.id] && selectedQuantities[exam.id] > 0)
    .map((exam) => {
      const quantity = selectedQuantities[exam.id]
      const lineTotal = exam.current_price * quantity
      return {
        exam_id: exam.id,
        exam_name: exam.name,
        unit_price: exam.current_price,
        quantity,
        line_total: lineTotal,
      } as SelectedExam
    })

  const totalValue = selectedExams.reduce((sum, item) => sum + item.line_total, 0)

  const handleExamToggle = (examId: number, checked: boolean) => {
    setSelectedQuantities((previous) => {
      const next = { ...previous }
      if (checked) {
        next[examId] = next[examId] ?? 1
      } else {
        delete next[examId]
      }
      return next
    })
  }

  const handleQuantityChange = (examId: number, quantityText: string) => {
    const quantity = Number(quantityText)
    if (!Number.isFinite(quantity) || quantity < 1) {
      return
    }

    setSelectedQuantities((previous) => ({
      ...previous,
      [examId]: Math.floor(quantity),
    }))
  }

  const resetOrderForm = () => {
    setOwnerName('')
    setOwnerPhone('')
    setOwnerEmail('')
    setPatientName('')
    setSpecies('')
    setBreed('')
    setAgeYears('')
    setSex('')
    setClinicalNotes('')
    setSelectedQuantities({})
  }

  const handleSubmitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)

    if (selectedExams.length === 0) {
      setMessage('Select at least one exam before sending the order.')
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.from('exam_orders').insert({
      vet_id: profile.id,
      vet_name_snapshot: profile.full_name,
      vet_email_snapshot: session.user.email ?? null,
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.trim() || null,
      owner_email: ownerEmail.trim() || null,
      patient_name: patientName.trim(),
      species: species.trim(),
      breed: breed.trim() || null,
      age_years: ageYears ? Number(ageYears) : null,
      sex: sex || null,
      clinical_notes: clinicalNotes.trim() || null,
      selected_exams: selectedExams,
      total_value: totalValue,
    })

    if (error) {
      setMessage(error.message)
      setIsSubmitting(false)
      return
    }

    setMessage('Exam order sent successfully.')
    resetOrderForm()
    setIsSubmitting(false)
    setActiveTab('history')
    void loadData()
  }

  return (
    <main className="page">
      <section className="card">
        <div className="card-header">
          <div>
            <h1>Vet Portal</h1>
            <p className="muted">Welcome, {profile.full_name ?? 'Doctor'}.</p>
          </div>
          <button className="secondary" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>

        <div className="tab-row">
          <button className={activeTab === 'order' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('order')}>
            Order a Vet Exam
          </button>
          <button className={activeTab === 'history' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('history')}>
            My Exam History
          </button>
          <button className={activeTab === 'prices' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('prices')}>
            Updated Value Table
          </button>
          <button className={activeTab === 'faq' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('faq')}>
            Technical Questions
          </button>
        </div>

        {message ? <p className="message">{message}</p> : null}

        {isLoading ? <p className="muted">Loading data...</p> : null}

        {!isLoading && activeTab === 'order' ? (
          <form className="form section" onSubmit={handleSubmitOrder}>
            <h2>Order a New Exam</h2>
            <p className="muted small">
              Your doctor information is attached automatically. Fill owner, patient, and exam selection.
            </p>

            <div className="grid two">
              <label>
                Owner name
                <input required value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
              </label>
              <label>
                Owner phone
                <input value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} />
              </label>
            </div>

            <div className="grid two">
              <label>
                Owner email
                <input type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} />
              </label>
              <label>
                Patient name
                <input required value={patientName} onChange={(event) => setPatientName(event.target.value)} />
              </label>
            </div>

            <div className="grid three">
              <label>
                Species
                <input required value={species} onChange={(event) => setSpecies(event.target.value)} />
              </label>
              <label>
                Breed
                <input value={breed} onChange={(event) => setBreed(event.target.value)} />
              </label>
              <label>
                Age (years)
                <input
                  min={0}
                  step={1}
                  type="number"
                  value={ageYears}
                  onChange={(event) => setAgeYears(event.target.value)}
                />
              </label>
            </div>

            <div className="grid two">
              <label>
                Sex
                <select value={sex} onChange={(event) => setSex(event.target.value)}>
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>
              <label>
                Clinical notes
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(event) => setClinicalNotes(event.target.value)}
                  placeholder="Symptoms, urgency, other details..."
                />
              </label>
            </div>

            <div className="section">
              <h3>Exam Selection</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Exam</th>
                      <th>Price</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examCatalog.map((exam) => {
                      const isSelected = Boolean(selectedQuantities[exam.id])
                      return (
                        <tr key={exam.id}>
                          <td>
                            <input
                              checked={isSelected}
                              type="checkbox"
                              onChange={(event) => handleExamToggle(exam.id, event.target.checked)}
                            />
                          </td>
                          <td>
                            <strong>{exam.name}</strong>
                            <p className="small muted">{exam.description ?? 'No description'}</p>
                          </td>
                          <td>{formatCurrency(exam.current_price)}</td>
                          <td>
                            <input
                              className="qty-input"
                              disabled={!isSelected}
                              min={1}
                              step={1}
                              type="number"
                              value={selectedQuantities[exam.id] ?? 1}
                              onChange={(event) => handleQuantityChange(exam.id, event.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="total-row">Estimated total: {formatCurrency(totalValue)}</p>
            </div>

            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Sending order...' : 'Send Exam Order'}
            </button>
          </form>
        ) : null}

        {!isLoading && activeTab === 'history' ? (
          <section className="section">
            <h2>My Exam History</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Owner</th>
                    <th>Exams</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7}>No exam orders yet.</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td>{formatDateTime(order.created_at)}</td>
                        <td>
                          {order.patient_name}
                          <p className="small muted">{order.species}</p>
                        </td>
                        <td>{order.owner_name}</td>
                        <td>
                          {order.selected_exams.map((exam) => `${exam.exam_name} x${exam.quantity}`).join(', ')}
                        </td>
                        <td>{formatCurrency(order.total_value)}</td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td>{formatDateTime(order.scheduled_for)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!isLoading && activeTab === 'prices' ? (
          <section className="section">
            <h2>Updated Value Table</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Description</th>
                    <th>Current price</th>
                  </tr>
                </thead>
                <tbody>
                  {examCatalog.map((exam) => (
                    <tr key={exam.id}>
                      <td>{exam.name}</td>
                      <td>{exam.description ?? '-'}</td>
                      <td>{formatCurrency(exam.current_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!isLoading && activeTab === 'faq' ? (
          <section className="section">
            <h2>Technical Questions</h2>
            <div className="faq-list">
              {faqEntries.length === 0 ? <p>No FAQ entries yet.</p> : null}
              {faqEntries.map((entry) => (
                <article className="faq-item" key={entry.id}>
                  <h3>{entry.question}</h3>
                  <p className="small muted">{entry.category ?? 'General'}</p>
                  <p>{entry.answer}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function AdminDashboard({
  profile,
  onSignOut,
}: {
  profile: Profile
  onSignOut: () => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders')
  const [examCatalog, setExamCatalog] = useState<ExamCatalogItem[]>([])
  const [orders, setOrders] = useState<ExamOrder[]>([])
  const [faqEntries, setFaqEntries] = useState<FaqEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({})
  const [orderEdits, setOrderEdits] = useState<Record<number, OrderEdit>>({})
  const [faqQuestion, setFaqQuestion] = useState('')
  const [faqAnswer, setFaqAnswer] = useState('')
  const [faqCategory, setFaqCategory] = useState('')

  const loadData = async () => {
    setIsLoading(true)

    const [{ data: examData, error: examError }, { data: orderData, error: orderError }, { data: faqData, error: faqError }] =
      await Promise.all([
        supabase.from('exam_catalog').select('id, name, description, current_price, active').order('name'),
        supabase.from('exam_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('faq_entries').select('id, question, answer, category, active').order('id', { ascending: false }),
      ])

    if (examError || orderError || faqError) {
      setMessage(examError?.message ?? orderError?.message ?? faqError?.message ?? 'Failed to load data.')
      setIsLoading(false)
      return
    }

    const exams = (examData ?? []) as ExamCatalogItem[]
    const parsedOrders = (orderData ?? []).map((item) => ({
      ...item,
      selected_exams: parseSelectedExams(item.selected_exams),
    })) as ExamOrder[]
    const faqs = (faqData ?? []) as FaqEntry[]

    const nextPriceDrafts: Record<number, string> = {}
    exams.forEach((exam) => {
      nextPriceDrafts[exam.id] = String(exam.current_price)
    })

    const nextOrderEdits: Record<number, OrderEdit> = {}
    parsedOrders.forEach((order) => {
      nextOrderEdits[order.id] = {
        status: order.status,
        scheduled_for: toDateTimeLocalValue(order.scheduled_for),
        admin_notes: order.admin_notes ?? '',
      }
    })

    setExamCatalog(exams)
    setOrders(parsedOrders)
    setFaqEntries(faqs)
    setPriceDrafts(nextPriceDrafts)
    setOrderEdits(nextOrderEdits)
    setIsLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [])

  const saveExamPrice = async (examId: number) => {
    setMessage(null)
    const draft = priceDrafts[examId]
    const parsed = Number(draft)

    if (!Number.isFinite(parsed) || parsed < 0) {
      setMessage('Price must be a number greater than or equal to zero.')
      return
    }

    const { error } = await supabase
      .from('exam_catalog')
      .update({ current_price: parsed, updated_at: new Date().toISOString() })
      .eq('id', examId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Price updated.')
    void loadData()
  }

  const saveOrder = async (orderId: number) => {
    setMessage(null)
    const edit = orderEdits[orderId]
    if (!edit) {
      return
    }

    const payload = {
      status: edit.status,
      scheduled_for: edit.scheduled_for ? new Date(edit.scheduled_for).toISOString() : null,
      admin_notes: edit.admin_notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('exam_orders').update(payload).eq('id', orderId)
    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Order updated.')
    void loadData()
  }

  const addFaqEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)

    const { error } = await supabase.from('faq_entries').insert({
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
      category: faqCategory.trim() || null,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setFaqQuestion('')
    setFaqAnswer('')
    setFaqCategory('')
    setMessage('FAQ entry created.')
    void loadData()
  }

  const toggleFaqActive = async (entry: FaqEntry) => {
    setMessage(null)
    const { error } = await supabase
      .from('faq_entries')
      .update({ active: !entry.active, updated_at: new Date().toISOString() })
      .eq('id', entry.id)

    if (error) {
      setMessage(error.message)
      return
    }

    void loadData()
  }

  return (
    <main className="page">
      <section className="card">
        <div className="card-header">
          <div>
            <h1>CVDE Admin Portal</h1>
            <p className="muted">Logged in as {profile.full_name ?? 'Administrator'}.</p>
          </div>
          <button className="secondary" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>

        <div className="tab-row">
          <button className={activeTab === 'orders' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('orders')}>
            Incoming Orders
          </button>
          <button className={activeTab === 'prices' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('prices')}>
            Exam Values
          </button>
          <button className={activeTab === 'faq' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('faq')}>
            FAQ Management
          </button>
        </div>

        {message ? <p className="message">{message}</p> : null}
        {isLoading ? <p className="muted">Loading data...</p> : null}

        {!isLoading && activeTab === 'orders' ? (
          <section className="section">
            <h2>All Exam Orders</h2>
            {orders.length === 0 ? <p>No orders yet.</p> : null}

            <div className="order-list">
              {orders.map((order) => {
                const edit = orderEdits[order.id]
                return (
                  <article className="order-card" key={order.id}>
                    <div className="order-card-head">
                      <h3>Order #{order.id}</h3>
                      <StatusBadge status={order.status} />
                    </div>

                    <p className="small muted">
                      Created: {formatDateTime(order.created_at)} | Vet: {order.vet_name_snapshot ?? 'Unknown'} (
                      {order.vet_email_snapshot ?? '-'})
                    </p>

                    <p>
                      <strong>Patient:</strong> {order.patient_name} ({order.species}) | <strong>Owner:</strong> {order.owner_name}
                    </p>

                    <p>
                      <strong>Exams:</strong>{' '}
                      {order.selected_exams.map((exam) => `${exam.exam_name} x${exam.quantity}`).join(', ')}
                    </p>

                    <p>
                      <strong>Total:</strong> {formatCurrency(order.total_value)}
                    </p>

                    <div className="grid three">
                      <label>
                        Status
                        <select
                          value={edit?.status ?? order.status}
                          onChange={(event) =>
                            setOrderEdits((previous) => ({
                              ...previous,
                              [order.id]: {
                                status: event.target.value as OrderStatus,
                                scheduled_for: edit?.scheduled_for ?? toDateTimeLocalValue(order.scheduled_for),
                                admin_notes: edit?.admin_notes ?? order.admin_notes ?? '',
                              },
                            }))
                          }
                        >
                          <option value="requested">requested</option>
                          <option value="scheduled">scheduled</option>
                          <option value="in_progress">in progress</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </label>

                      <label>
                        Scheduled for
                        <input
                          type="datetime-local"
                          value={edit?.scheduled_for ?? toDateTimeLocalValue(order.scheduled_for)}
                          onChange={(event) =>
                            setOrderEdits((previous) => ({
                              ...previous,
                              [order.id]: {
                                status: edit?.status ?? order.status,
                                scheduled_for: event.target.value,
                                admin_notes: edit?.admin_notes ?? order.admin_notes ?? '',
                              },
                            }))
                          }
                        />
                      </label>

                      <label>
                        Admin notes
                        <input
                          value={edit?.admin_notes ?? order.admin_notes ?? ''}
                          onChange={(event) =>
                            setOrderEdits((previous) => ({
                              ...previous,
                              [order.id]: {
                                status: edit?.status ?? order.status,
                                scheduled_for: edit?.scheduled_for ?? toDateTimeLocalValue(order.scheduled_for),
                                admin_notes: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    </div>

                    <button className="secondary" type="button" onClick={() => void saveOrder(order.id)}>
                      Save Order Update
                    </button>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        {!isLoading && activeTab === 'prices' ? (
          <section className="section">
            <h2>Exam Value Management</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Description</th>
                    <th>Current Price</th>
                    <th>New Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {examCatalog.map((exam) => (
                    <tr key={exam.id}>
                      <td>{exam.name}</td>
                      <td>{exam.description ?? '-'}</td>
                      <td>{formatCurrency(exam.current_price)}</td>
                      <td>
                        <input
                          className="qty-input"
                          min={0}
                          step="0.01"
                          type="number"
                          value={priceDrafts[exam.id] ?? String(exam.current_price)}
                          onChange={(event) =>
                            setPriceDrafts((previous) => ({
                              ...previous,
                              [exam.id]: event.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <button className="secondary" type="button" onClick={() => void saveExamPrice(exam.id)}>
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!isLoading && activeTab === 'faq' ? (
          <section className="section">
            <h2>FAQ Management</h2>

            <form className="form faq-form" onSubmit={addFaqEntry}>
              <label>
                Question
                <input required value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} />
              </label>
              <label>
                Answer
                <textarea required rows={3} value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} />
              </label>
              <label>
                Category
                <input value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)} />
              </label>
              <button type="submit">Add FAQ</button>
            </form>

            <div className="faq-list">
              {faqEntries.map((entry) => (
                <article className="faq-item" key={entry.id}>
                  <div className="faq-head">
                    <h3>{entry.question}</h3>
                    <button className="secondary" type="button" onClick={() => void toggleFaqActive(entry)}>
                      {entry.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                  <p className="small muted">{entry.category ?? 'General'}</p>
                  <p>{entry.answer}</p>
                  <p className="small muted">Status: {entry.active ? 'active' : 'inactive'}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function MissingProfile({ onSignOut }: { onSignOut: () => Promise<void> }) {
  return (
    <main className="page">
      <section className="card">
        <h1>Profile Not Ready</h1>
        <p className="muted">
          Your account exists, but your role profile is missing. Ask CVDE admin to run the database setup SQL files.
        </p>
        <button type="button" onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </main>
  )
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return data as Profile
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) {
        return
      }

      const currentSession = data.session
      setSession(currentSession)

      if (currentSession?.user) {
        const nextProfile = await fetchProfile(currentSession.user.id)
        if (mounted) {
          setProfile(nextProfile)
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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (!nextSession?.user) {
        setProfile(null)
        return
      }

      void fetchProfile(nextSession.user.id).then((nextProfile) => {
        setProfile(nextProfile)
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const defaultPath = useMemo(() => {
    if (!session) {
      return '/login'
    }

    if (profile?.role === 'admin_user') {
      return '/admin'
    }

    return '/app'
  }, [profile?.role, session])

  if (isLoading) {
    return (
      <main className="page">
        <section className="card">
          <h1>Loading...</h1>
        </section>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate replace to={defaultPath} /> : <AuthPage />} />

      <Route
        path="/app"
        element={
          !session ? (
            <Navigate replace to="/login" />
          ) : !profile ? (
            <MissingProfile onSignOut={signOut} />
          ) : profile.role === 'vet_user' ? (
            <VetDashboard onSignOut={signOut} profile={profile} session={session} />
          ) : (
            <Navigate replace to="/admin" />
          )
        }
      />

      <Route
        path="/admin"
        element={
          !session ? (
            <Navigate replace to="/login" />
          ) : !profile ? (
            <MissingProfile onSignOut={signOut} />
          ) : profile.role === 'admin_user' ? (
            <AdminDashboard onSignOut={signOut} profile={profile} />
          ) : (
            <Navigate replace to="/app" />
          )
        }
      />

      <Route element={<Navigate replace to={defaultPath} />} path="*" />
    </Routes>
  )
}

export default App
