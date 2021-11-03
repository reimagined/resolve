import type { AdapterPool } from './types'

const dispose = async ({ database }: AdapterPool): Promise<void> => {
  if (database) await database.close()
}

export default dispose
