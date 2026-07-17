const fs = require('node:fs/promises')
const path = require('node:path')
const mysql = require('mysql2/promise')

const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']

function databaseConfig() {
  const missing = requiredVariables.filter((name) => !process.env[name])
  if (missing.length) {
    throw new Error(`Missing MySQL environment variables: ${missing.join(', ')}`)
  }

  const port = Number.parseInt(process.env.DB_PORT || '3306', 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be a valid TCP port')
  }

  return {
    host: process.env.DB_HOST,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  }
}

function statements(sql) {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
}

async function main() {
  const connection = await mysql.createConnection(databaseConfig())
  let lockAcquired = false

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) NOT NULL,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    const [lockRows] = await connection.execute(
      "SELECT GET_LOCK('ilovebiodata_schema_migrations', 30) AS acquired",
    )
    lockAcquired = lockRows[0]?.acquired === 1
    if (!lockAcquired) throw new Error('Could not acquire the migration lock')

    const migrationsDirectory = path.join(process.cwd(), 'migrations')
    const files = (await fs.readdir(migrationsDirectory))
      .filter((file) => /^\d+.*\.sql$/.test(file))
      .sort()
    const [appliedRows] = await connection.execute(
      'SELECT version FROM schema_migrations ORDER BY version',
    )
    const applied = new Set(appliedRows.map((row) => row.version))

    if (process.argv.includes('--status')) {
      for (const file of files) {
        console.log(`${applied.has(file) ? 'applied' : 'pending'} ${file}`)
      }
      return
    }

    for (const file of files) {
      if (applied.has(file)) continue

      const sql = await fs.readFile(path.join(migrationsDirectory, file), 'utf8')
      for (const statement of statements(sql)) {
        await connection.query(statement)
      }
      await connection.execute(
        'INSERT INTO schema_migrations (version) VALUES (?)',
        [file],
      )
      console.log(`applied ${file}`)
    }

    console.log('Database schema is up to date')
  } finally {
    if (lockAcquired) {
      await connection.execute(
        "SELECT RELEASE_LOCK('ilovebiodata_schema_migrations')",
      )
    }
    await connection.end()
  }
}

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`)
  process.exitCode = 1
})
