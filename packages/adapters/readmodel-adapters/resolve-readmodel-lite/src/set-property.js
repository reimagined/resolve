const setProperty = async (pool, readModelName, key, value) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escape } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  await inlineLedgerRunQuery(
    `UPDATE ${ledgerTableNameAsId}
     SET "Properties" = json_patch("Properties", JSON(${escape(
       JSON.stringify({
         [key
           .replace(/\u001a/g, '\u001a0')
           .replace(/"/g, '\u001a1')
           .replace(/\./g, '\u001a2')]: value,
       })
     )}))
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )
}

export default setProperty
