import type { AdapterPool } from './types'

const executeQuery = async (pool: AdapterPool, sql: string): Promise<void> => {
  await pool.database.exec(sql)
}

export default executeQuery
