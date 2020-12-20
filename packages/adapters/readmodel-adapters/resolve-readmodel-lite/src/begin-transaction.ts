import { RunQuery } from './types'

const beginTransaction = async (pool: { runQuery: RunQuery }) => {
  const { runQuery } = pool

  try {
    await runQuery(`ROLLBACK;`, true)
  } catch (error) {}

  await runQuery(`BEGIN IMMEDIATE;`, true)
}

export default beginTransaction
