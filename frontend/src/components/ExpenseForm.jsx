import { useState } from 'react'
import { CATEGORIES } from '../utils/constants.js'
import { todayISO } from '../utils/format.js'

// Used for both adding (initial = null) and editing (initial = an expense).
function ExpenseForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    amount: initial ? String(initial.amount) : '',
    type: initial?.type ?? 'expense',
    category: initial?.category ?? CATEGORIES[0],
    date: initial?.date ?? todayISO(),
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const bind = (field) => ({
    id: field,
    value: form[field],
    onChange: (e) => setForm({ ...form, [field]: e.target.value }),
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {}
    if (!form.title.trim()) found.title = 'Title is required'
    if (!(Number(form.amount) > 0)) found.amount = 'Enter an amount greater than 0'
    if (!form.date) found.date = 'Date is required'
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setSubmitError('')
    try {
      // On success the parent closes the form.
      await onSubmit({ ...form, title: form.title.trim(), amount: Number(form.amount) })
    } catch (err) {
      setSubmitError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <form className="panel form" onSubmit={handleSubmit} noValidate>
      <h2>{initial ? 'Edit transaction' : 'Add transaction'}</h2>

      <div className="field">
        <label htmlFor="title">Title</label>
        <input {...bind('title')} placeholder="Groceries" />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="amount">Amount (₹)</label>
          <input {...bind('amount')} type="number" min="0" step="0.01" />
          {errors.amount && <p className="field-error">{errors.amount}</p>}
        </div>
        <div className="field">
          <label htmlFor="type">Type</label>
          <select {...bind('type')}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="category">Category</label>
          <select {...bind('category')}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="date">Date</label>
          <input {...bind('date')} type="date" />
          {errors.date && <p className="field-error">{errors.date}</p>}
        </div>
      </div>

      {submitError && <p className="form-error">{submitError}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add'}
        </button>
      </div>
    </form>
  )
}

export default ExpenseForm
