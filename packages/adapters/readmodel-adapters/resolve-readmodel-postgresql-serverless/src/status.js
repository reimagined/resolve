const status = async (pool, readModelName) => {
  const { schemaName, escapeId, escape, inlineLedgerExecuteStatement } = pool;

  const databaseNameAsId = escapeId(schemaName);
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`);

  const rows = await inlineLedgerExecuteStatement(
    pool,
    `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  );

  if (rows.length === 1) {
    return {
      successEvent: JSON.parse(rows[0].SuccessEvent),
      failedEvent: JSON.parse(rows[0].FailedEvent),
      errors: JSON.parse(rows[0].Errors),
      cursor: JSON.parse(rows[0].Cursor),
    };
  } else {
    return null;
  }
};

export default status;
