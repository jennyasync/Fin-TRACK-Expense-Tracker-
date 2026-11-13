import pg from 'pg'

// One shared pool reuses connections instead of opening one per request.
export default new pg.Pool({ connectionString: process.env.DATABASE_URL })
