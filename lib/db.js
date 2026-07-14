import mysql from 'mysql2/promise'

let pool = null

function getPool() {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000, // 10 seconds
      })
    } catch (e) {
      console.error('Failed to initialize MySQL Connection Pool:', e)
      throw e
    }
  }
  return pool
}

/**
 * Execute a parameterized MySQL query safely.
 * Uses prepared statements (pool.execute) internally.
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<any>}
 */
export async function query(sql, params = []) {
  try {
    const dbPool = getPool()
    const [results] = await dbPool.execute(sql, params)
    return results
  } catch (error) {
    console.error('Database execution error:', error)
    // Throw error so caller can handle gracefully instead of silently swallowing or crashing
    throw error
  }
}
