const deleteProperty = async (pool, readModelName, key) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escape } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  await inlineLedgerRunQuery(
    `UPDATE ${ledgerTableNameAsId}
     SET "Properties" = JSON_REMOVE("Properties", ${escape(
       `$.${key
         .replace(/\u001a/g, '\u001a0')
         .replace(/"/g, '\u001a1')
         .replace(/\./g, '\u001a2')}`
     )})
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )
}

export default deleteProperty
