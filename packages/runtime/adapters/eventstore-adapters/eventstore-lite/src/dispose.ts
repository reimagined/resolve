import type { AdapterPool } from './types'

const dispose = async (pool: AdapterPool): Promise<void> => {
  if (pool.database) {
    await pool.database.close()
    pool.database = undefined
  }
}

export default dispose
