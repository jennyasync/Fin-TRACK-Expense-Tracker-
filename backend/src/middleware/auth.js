import jwt from 'jsonwebtoken'

// Checks "Authorization: Bearer <token>" and puts the user id on req.
export default function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
