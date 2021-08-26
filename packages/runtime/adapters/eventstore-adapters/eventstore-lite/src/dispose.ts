import type { AdapterPool } from './types'

const dispose = async ({ database }: AdapterPool): Promise<void> => {
  await database.close()
}

export default dispose
