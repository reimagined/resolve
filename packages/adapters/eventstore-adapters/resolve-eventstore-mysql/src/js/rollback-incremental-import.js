const rollbackIncrementalImport = async ({
  events: { eventsTableName, connection },
  escapeId,
}) => {
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  );
  await connection.query(`DROP TABLE IF EXISTS ${incrementalImportTableAsId};`);
};

export default rollbackIncrementalImport;
