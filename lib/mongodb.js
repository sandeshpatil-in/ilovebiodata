import { MongoClient } from 'mongodb'

const uri = process.env.MONGO_URL
const dbName = process.env.DB_NAME || 'ilovebiodata'

let clientPromise
if (uri) {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
}

export async function getDb() {
  if (!uri) throw new Error('MONGO_URL is required')
  const c = await clientPromise
  return c.db(dbName)
}

export default clientPromise

