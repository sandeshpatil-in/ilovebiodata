import mysql from 'mysql2/promise'

const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']

function createPool() {
  const missing = requiredVariables.filter((name) => !process.env[name])
  if (missing.length) {
    throw new Error(`Missing MySQL environment variables: ${missing.join(', ')}`)
  }

  const port = Number.parseInt(process.env.DB_PORT || '3306', 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be a valid TCP port')
  }

  return mysql.createPool({
    host: process.env.DB_HOST,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  })
}

export function getPool() {
  if (!globalThis._mysqlPool) {
    globalThis._mysqlPool = createPool()
  }
  return globalThis._mysqlPool
}

export async function pingDatabase() {
  await getPool().query('SELECT 1')
}
