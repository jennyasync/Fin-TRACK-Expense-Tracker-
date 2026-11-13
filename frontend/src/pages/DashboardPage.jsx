import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import SummaryCards from '../components/SummaryCards.jsx'
import Filters from '../components/Filters.jsx'
import ExpenseForm from '../components/ExpenseForm.jsx'
import ExpenseList from '../components/ExpenseList.jsx'
import MonthlyChart from '../components/MonthlyChart.jsx'
import CategoryChart from '../components/CategoryChart.jsx'
import { monthKey } from '../utils/format.js'

const DEFAULT_FILTERS = { search: '', type: 'all', category: 'all', month: '', sort: 'date-desc' }

const SORTS = {
  'date-desc': (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
  'date-asc': (a, b) => a.date.localeCompare(b.date) || a.id - b.id,
  'amount-desc': (a, b) => b.amount - a.amount,
  'amount-asc': (a, b) => a.amount - b.amount,
}

// Owns the expenses and filters. Child components only get props.
function DashboardPage() {
  const { logout } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  // null = form hidden, { expense: null } = adding, { expense } = editing
  const [formState, setFormState] = useState(null)

  useEffect(() => {
    api
      .getExpenses()
      .then((data) => setExpenses(data.expenses))
      .catch((err) => (err.status === 401 ? logout() : setLoadError(err.message)))
      .finally(() => setLoading(false))
  }, [logout])

  const visible = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return expenses
      .filter(
        (e) =>
          e.title.toLowerCase().includes(search) &&
          (filters.type === 'all' || e.type === filters.type) &&
          (filters.category === 'all' || e.category === filters.category) &&
          (!filters.month || monthKey(e.date) === filters.month),
      )
      .sort(SORTS[filters.sort])
  }, [expenses, filters])

  const sum = (type) => visible.filter((e) => e.type === type).reduce((total, e) => total + e.amount, 0)

  async function handleSave(data) {
    if (formState.expense) {
      const { expense } = await api.updateExpense(formState.expense.id, data)
      setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)))
    } else {
      const { expense } = await api.createExpense(data)
      setExpenses((prev) => [expense, ...prev])
    }
    setFormState(null)
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Delete "${expense.title}"?`)) return
    try {
      await api.deleteExpense(expense.id)
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id))
    } catch (err) {
      alert(err.message)
    }
  }

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <>
      <Navbar />
      <main className="container">
        {loading && <p className="center-message">Loading transactions…</p>}

        {loadError && (
          <div className="error-box">
            <p>{loadError}</p>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <>
            <SummaryCards income={sum('income')} expenses={sum('expense')} />

            <div className="toolbar">
              <h2>Transactions</h2>
              {!formState && (
                <button className="btn btn-primary" onClick={() => setFormState({ expense: null })}>
                  Add transaction
                </button>
              )}
            </div>

            {formState && (
              <ExpenseForm
                // A new key gives a fresh form when switching between add and edit.
                key={formState.expense?.id ?? 'new'}
                initial={formState.expense}
                onSubmit={handleSave}
                onCancel={() => setFormState(null)}
              />
            )}

            <Filters filters={filters} onChange={setFilters} />
            {hasFilters && (
              <button className="btn-link" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear filters
              </button>
            )}

            <ExpenseList
              expenses={visible}
              totalCount={expenses.length}
              onEdit={(expense) => setFormState({ expense })}
              onDelete={handleDelete}
            />

            <div className="charts">
              <MonthlyChart expenses={expenses} />
              <CategoryChart expenses={visible} />
            </div>
          </>
        )}
      </main>
    </>
  )
}

export default DashboardPage
