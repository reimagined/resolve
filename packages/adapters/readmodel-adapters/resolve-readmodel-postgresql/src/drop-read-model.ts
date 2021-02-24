import { DropReadModelMethod } from './types'

const dropReadModel: DropReadModelMethod = async (
  { inlineLedgerRunQuery, escapeId, schemaName, escapeStr },
  readModelName
) => {
  const rows = (await inlineLedgerRunQuery(
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
    await inlineLedgerRunQuery(
      `DROP TABLE ${escapeId(schemaName)}.${escapeId(tableName)};`
    )
  }
}

export default dropReadModel
