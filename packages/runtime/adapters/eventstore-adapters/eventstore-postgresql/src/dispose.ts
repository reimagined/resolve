import type { AdapterPool } from './types'

const dispose = async ({ connection }: AdapterPool): Promise<void> => {
  await connection.end()
}

export default dispose
