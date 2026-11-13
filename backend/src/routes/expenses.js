import { Router } from 'express'
import pool from '../db.js'
import requireAuth from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.param('id', (req, res, next, id) =>
  Number.isInteger(Number(id)) ? next() : res.status(400).json({ error: 'Invalid id' }),
)

const CATEGORIES = ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Salary', 'Other']

// to_char keeps the date as plain "YYYY-MM-DD" (no timezone shift). ::float makes amount a JSON number.
const COLUMNS = `id, title, amount::float AS amount, type, category, to_char(date, 'YYYY-MM-DD') AS date`

// Returns { error } or { value } with the cleaned fields.
function validate(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const amount = Number(body.amount)
  const { type, category, date } = body

  if (!title) return { error: 'Title is required' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Amount must be a positive number' }
  if (type !== 'income' && type !== 'expense') return { error: 'Type must be income or expense' }
  if (!CATEGORIES.includes(category)) return { error: 'Invalid category' }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Date must be YYYY-MM-DD' }
  return { value: [title, amount, type, category, date] }
}

// GET /api/expenses
router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT ${COLUMNS} FROM expenses WHERE user_id = $1 ORDER BY date DESC, id DESC`,
    [req.userId],
  )
  res.json({ expenses: result.rows })
})

// POST /api/expenses
router.post('/', async (req, res) => {
  const { error, value } = validate(req.body)
  if (error) return res.status(400).json({ error })

  const result = await pool.query(
    `INSERT INTO expenses (title, amount, type, category, date, user_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
    [...value, req.userId],
  )
  res.status(201).json({ expense: result.rows[0] })
})

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  const { error, value } = validate(req.body)
  if (error) return res.status(400).json({ error })

  // "AND user_id" stops one user from editing another user's expense.
  const result = await pool.query(
    `UPDATE expenses SET title = $1, amount = $2, type = $3, category = $4, date = $5
     WHERE id = $6 AND user_id = $7 RETURNING ${COLUMNS}`,
    [...value, req.params.id, req.userId],
  )
  if (!result.rows.length) return res.status(404).json({ error: 'Expense not found' })
  res.json({ expense: result.rows[0] })
})

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
  if (!result.rowCount) return res.status(404).json({ error: 'Expense not found' })
  res.status(204).end()
})

export default router
