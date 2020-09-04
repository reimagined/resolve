import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql:commit-transaction'
)

const commitTransaction = async (pool) => {
  try {
    log.verbose('Commit transaction to postgresql database started')

    await pool.runQuery('SELECT 0 AS "defunct"')
    await pool.runQuery('COMMIT')

    log.verbose('Commit transaction to postgresql database succeed')
  } catch (error) {
    log.verbose('Commit transaction to postgresql database failed', error)

    throw error
  }
}

export default commitTransaction
