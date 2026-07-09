import { MongoClient } from 'mongodb'

const uri = process.env.MONGO_URL
const dbName = process.env.DB_NAME || 'ilovebiodata'

if (!uri) throw new Error('MONGO_URL is required')

let clientPromise
if (!global._mongoClientPromise) {
  const client = new MongoClient(uri)
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise

export async function getDb() {
  const c = await clientPromise
  return c.db(dbName)
}

export default clientPromise
