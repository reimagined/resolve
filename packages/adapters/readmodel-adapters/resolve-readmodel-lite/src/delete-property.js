const deleteProperty = async (pool, readModelName, key) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    fullJitter,
    escapeId,
    escape,
  } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  while (true) {
    try {
      await inlineLedgerRunQuery(
        `BEGIN IMMEDIATE;

        UPDATE ${ledgerTableNameAsId}
         SET "Properties" = JSON_REMOVE("Properties", ${escape(
           `$.${key
             .replace(/\u001a/g, '\u001a0')
             .replace(/"/g, '\u001a1')
             .replace(/\./g, '\u001a2')}`
         )})
         WHERE "EventSubscriber" = ${escape(readModelName)};
         
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
}

export default deleteProperty
