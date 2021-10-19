import type { AdapterPool } from './types'

const executeStatement = async (
  pool: AdapterPool,
  sql: string
): Promise<any[]> => {
  return pool.database.prepare(sql).all()
}

export default executeStatement
