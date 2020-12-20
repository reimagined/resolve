import { RunQuery } from './types'

const commitTransaction = async (pool: { runQuery: RunQuery }) => {
  const { runQuery } = pool

  await runQuery(`COMMIT;`, true)
}

export default commitTransaction
