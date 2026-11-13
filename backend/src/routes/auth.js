import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import requireAuth from '../middleware/auth.js'

const router = Router()

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
const isValidEmail = (email) => typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email)

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
  if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required' })
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const cleanEmail = email.trim().toLowerCase()
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail])
  if (existing.rows.length) return res.status(409).json({ error: 'An account with this email already exists' })

  const passwordHash = await bcrypt.hash(password, 10)
  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name.trim(), cleanEmail, passwordHash],
  )
  const user = result.rows[0]
  res.status(201).json({ token: signToken(user.id), user })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!isValidEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [
    email.trim().toLowerCase(),
  ])
  const row = result.rows[0]
  // Same error for an unknown email and a wrong password, so nobody can check which emails exist.
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  res.json({ token: signToken(row.id), user: { id: row.id, name: row.name, email: row.email } })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId])
  if (!result.rows.length) return res.status(401).json({ error: 'User no longer exists' })
  res.json({ user: result.rows[0] })
})

export default router
