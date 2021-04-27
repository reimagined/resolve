import type { DropReadModelMethod } from './types'

const dropReadModel: DropReadModelMethod = async (pool, readModelName) => {
  const { inlineLedgerExecuteStatement, escapeId, schemaName, escapeStr } = pool
  const rows = (await inlineLedgerExecuteStatement(
    pool,
    `SELECT ${escapeId('CLS')}.${escapeId('relname')} AS ${escapeId(
      'tableName'
    )}
    FROM ${escapeId('pg_catalog')}.${escapeId('pg_class')} ${escapeId('CLS')}
    LEFT JOIN ${escapeId('pg_catalog')}.${escapeId(
      'pg_description'
    )} ${escapeId('DESC')}
    ON ${escapeId('CLS')}.${escapeId('oid')} = ${escapeId('DESC')}.${escapeId(
      'objoid'
    )}
    LEFT JOIN ${escapeId('pg_catalog')}.${escapeId('pg_namespace')} ${escapeId(
      'NS'
    )}
    ON ${escapeId('CLS')}.${escapeId('relnamespace')} = ${escapeId(
      'NS'
    )}.${escapeId('oid')}
    WHERE ${escapeId('DESC')}.${escapeId('description')} = ${escapeStr(
      `RESOLVE-${readModelName}`
    )}
    AND ${escapeId('NS')}.${escapeId('nspname')} = ${escapeStr(schemaName)}
    AND ${escapeId('CLS')}.${escapeId('relkind')} = ${escapeStr('r')}
    ;`
  )) as Array<{ tableName: string }>

  for (const { tableName } of rows) {
    await inlineLedgerExecuteStatement(
      pool,
      `DROP TABLE ${escapeId(schemaName)}.${escapeId(tableName)};`
    )
  }
}

export default dropReadModel
