import type { ExternalMethods } from './types'

const listProperties: ExternalMethods['listProperties'] = async (
  pool,
  readModelName
) => {
  const {
    PassthroughError,
    fullJitter,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    for (let retry = 0; ; retry++) {
      try {
        const rows = (await inlineLedgerRunQuery(
          `SELECT "Properties" FROM ${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}`
        )) as Array<{ Properties: string }>

        const properties =
          rows.length === 1 && rows[0].Properties != null
            ? JSON.parse(rows[0].Properties)
            : null

        if (properties == null) {
          return null
        }

        for (const key of [...Object.keys(properties)]) {
          const nextKey = String(key)
            .replace(/\u001a2/g, '.')
            .replace(/\u001a1/g, '"')
            .replace(/\u001a0/g, '\u001a')
          const value = properties[key]
          delete properties[key]
          properties[nextKey] = value
        }

        return properties
      } catch (error) {
        if (!(error instanceof PassthroughError)) {
          throw error
        }

        await fullJitter(retry)
      }
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default listProperties
