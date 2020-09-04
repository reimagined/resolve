const getProperty = async (pool, readModelName, key) => {
  const { schemaName, escapeId, escape, inlineLedgerExecuteStatement } = pool;

  const databaseNameAsId = escapeId(schemaName);
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`);

  const rows = await inlineLedgerExecuteStatement(
    pool,
    `SELECT "Properties" -> ${escape(key)} AS "Value"
     FROM  ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  );

  if (rows.length === 1 && rows[0].Value != null) {
    return rows[0].Value;
  } else {
    return null;
  }
};

export default getProperty;
