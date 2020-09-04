const listProperties = async (pool, readModelName) => {
  const { schemaName, escapeId, escape, inlineLedgerExecuteStatement } = pool;

  const databaseNameAsId = escapeId(schemaName);
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`);

  const rows = await inlineLedgerExecuteStatement(
    pool,
    `SELECT "Properties"
     FROM  ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  );

  if (rows.length === 1) {
    return rows[0].Properties;
  } else {
    return null;
  }
};

export default listProperties;
