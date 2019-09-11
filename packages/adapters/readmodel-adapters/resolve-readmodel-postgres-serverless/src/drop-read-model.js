const dropReadModel = async (
  { executeStatement, escapeId, schemaName, escape },
  readModelName
) => {
  const rows = await executeStatement(
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
    WHERE ${escapeId('DESC')}.${escapeId('description')} = ${escape(
      `RESOLVE-${readModelName}`
    )}
    AND ${escapeId('NS')}.${escapeId('nspname')} = ${escape(schemaName)}
    AND ${escapeId('CLS')}.${escapeId('relkind')} = ${escape('r')}
    ;`
  )

  for (const { tableName } of rows) {
    await executeStatement(
      `DROP TABLE ${escapeId(schemaName)}.${escapeId(tableName)};`
    )
  }
}

export default dropReadModel
