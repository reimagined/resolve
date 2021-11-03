import type { AdapterPool } from './types'

const dispose = async ({ connection }: AdapterPool): Promise<void> => {
  if (connection !== undefined) await connection.end()
}

export default dispose
