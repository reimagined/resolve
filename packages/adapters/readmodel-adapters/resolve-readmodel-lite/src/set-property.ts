import type { ExternalMethods } from './types'

const setProperty: ExternalMethods['setProperty'] = async (
  pool,
  readModelName,
  key,
  value
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    fullJitter,
    escapeId,
    escapeStr,
  } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    while (true) {
      try {
        await inlineLedgerRunQuery(
          `BEGIN IMMEDIATE;
        
        UPDATE ${ledgerTableNameAsId}
         SET "Properties" = json_patch("Properties", JSON(${escapeStr(
           JSON.stringify({
             [key
               .replace(/\u001a/g, '\u001a0')
               .replace(/"/g, '\u001a1')
               .replace(/\./g, '\u001a2')]: value,
           })
         )}))
         WHERE "EventSubscriber" = ${escapeStr(readModelName)};

         COMMIT;
        `,
          true
        )
        break
      } catch (error) {
        if (!(error instanceof PassthroughError)) {
          throw error
        }

        try {
          await inlineLedgerRunQuery(`ROLLBACK`, true)
        } catch (err) {
          if (!(err instanceof PassthroughError)) {
            throw err
          }
        }

        await fullJitter(0)
      }
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default setProperty
