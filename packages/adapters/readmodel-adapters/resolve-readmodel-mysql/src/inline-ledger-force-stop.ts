import type { InlineLedgerForceStopMethod } from './types'

const inlineLedgerForceStop: InlineLedgerForceStopMethod = async (
  pool,
  readModelName
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  const trxTableNameAsId = escapeId(`${tablePrefix}__TRX__`)

  while (true) {
    try {
      await inlineLedgerRunQuery(
        `DELETE FROM ${trxTableNameAsId} WHERE \`Timestamp\` < 
        CAST(ROUND(UNIX_TIMESTAMP(SYSDATE(4)) * 1000) AS UNSIGNED INTEGER) - 86400000
        `
      )

      const rows = (await inlineLedgerRunQuery(
        `SELECT \`B\`.\`XaValue\` FROM ${ledgerTableNameAsId} \`A\`
         LEFT JOIN ${trxTableNameAsId} \`B\`
         ON \`A\`.\`XaKey\` = \`B\`.\`XaKey\`
         WHERE \`A\`.\`EventSubscriber\` = ${escapeStr(readModelName)}
        `
      )) as Array<{ XaValue: string }>

      if (rows != null && rows.length > 0 && rows[0] != null) {
        const xaValue = +rows[0].XaValue
        const pid = !isNaN(xaValue) ? +rows[0].XaValue : 0
        try {
          await inlineLedgerRunQuery(`KILL ${+pid}`)
        } catch (e) {}
      }

      break
    } catch (error) {
      if (error instanceof PassthroughError) {
        continue
      }

      throw error
    }
  }
}

export default inlineLedgerForceStop
