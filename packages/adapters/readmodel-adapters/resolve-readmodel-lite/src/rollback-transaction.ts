import { RunQuery } from './types'

const rollbackTransaction = async (pool: { runQuery: RunQuery }) => {
  const { runQuery } = pool

  await runQuery(`ROLLBACK;`)
}

export default rollbackTransaction
