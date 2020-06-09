import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql:begin-transaction'
)

const beginTransaction = async (pool, readModelName) => {
  try {
    log.verbose('Begin transaction to postgresql database started')
    try {
      await pool.rollbackTransaction(pool.transactionId)
    } catch (error) {}

    await pool.runQuery('BEGIN TRANSACTION')

    pool.readModelName = readModelName

    log.verbose('Begin transaction to postgresql database succeed')
  } catch (error) {
    log.verbose('Begin transaction to postgresql database failed', error)

    throw error
  }
}

export default beginTransaction
