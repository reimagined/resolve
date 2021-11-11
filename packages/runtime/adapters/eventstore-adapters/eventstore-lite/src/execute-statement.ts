import type { AdapterPool } from './types'
import ensureConnect from './ensure-connect'

const executeStatement = async (
  pool: AdapterPool,
  sql: string
): Promise<any[]> => {
  const database = await ensureConnect(pool)
  return database.prepare(sql).all()
}

export default executeStatement
