const rollbackIncrementalImport = async ({
  database,
  eventsTableName,
  escapeId,
}) => {
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  );
  await database.exec(`DROP TABLE IF EXISTS ${incrementalImportTableAsId};`);
};

export default rollbackIncrementalImport;
