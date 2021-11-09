import type { AdapterPool } from './types'
import ensureConnect from './ensure-connect'

const executeQuery = async (pool: AdapterPool, sql: string): Promise<void> => {
  const database = await ensureConnect(pool)
  await database.exec(sql)
}

export default executeQuery
