const loadSnapshot = async (
  { events: { snapshotsTableName, connection }, escapeId, escape },
  snapshotKey
) => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string');
  }

  const snapshotsTableNameAsId = escapeId(snapshotsTableName);

  const [rows] = await connection.query(
    `SELECT \`SnapshotContent\` FROM ${snapshotsTableNameAsId}
   WHERE \`SnapshotKey\`= ${escape(snapshotKey)} `
  );
  const content = rows.length > 0 ? rows[0].SnapshotContent.toString() : null;

  return content;
};

export default loadSnapshot;
