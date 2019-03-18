import sqlite from 'sqlite'

const escapeString = str => str.replace(/(["\\])/gi, '\\$1')

const dispose = async ({ database }, dropInfo) => {
  if (dropInfo) {
    await database.exec(`
			DROP TABLE \`Listeners\`;
			COMMIT;
		`)
  }
  await database.close()
}

const rewindListener = async ({ database }, listenerId) => {
  await database.exec(`
	  DELETE FROM \`Listeners\` WHERE \`ListenerId\` = "${escapeString(
      listenerId
    )}";
	  COMMIT;
	  BEGIN IMMEDIATE;
  `)
}

const getListenerInfo = async ({ database }, listenerId) => {
  return await database.get(`
    SELECT \`AbutTimestamp\`,\`SkipCount\` FROM \`Listeners\`
    WHERE \`ListenerId\` = "${escapeString(listenerId)}"
  `)
}

const updateListenerInfo = async (
  { database },
  listenerId,
  { AbutTimestamp, SkipCount }
) => {
  await database.exec(`
    INSERT OR REPLACE INTO \`Listeners\`(
      \`ListenerId\`, \`AbutTimestamp\`, \`SkipCount\`
    ) VALUES(
      "${escapeString(listenerId)}",
      ${Number(AbutTimestamp)},
      ${Number(SkipCount)}
    );
    COMMIT;
    BEGIN IMMEDIATE;
  `)
}

const init = async ({ databaseFile }) => {
  const database = await sqlite.open(databaseFile)
  // https://github.com/mapbox/node-sqlite3/wiki/API#databaseconfigureoption-value
  await database.configure('busyTimeout', 0)

  try {
    // Exclusive lock via https://stackoverflow.com/a/34480741/7878274
    await database.exec(`BEGIN IMMEDIATE;`)
  } catch (err) {
    await database.close()
    throw new Error('Local Event Broker should be ran in single instance')
  }

  await database.exec(`
	  CREATE TABLE IF NOT EXISTS \`Listeners\` (
			\`ListenerId\` VARCHAR(128) NOT NULL,
		  \`AbutTimestamp\` BIGINT NOT NULL DEFAULT 0,
			\`SkipCount\` BIGINT NOT NULL DEFAULT 0,
		  PRIMARY KEY(\`ListenerId\`)
		);
		COMMIT;
		BEGIN IMMEDIATE;
	`)

  const pool = { database }

  return Object.freeze({
    dispose: () => dispose(pool),
    rewindListener: listenerId => rewindListener(pool, listenerId),
    getListenerInfo: listenerId => getListenerInfo(pool, listenerId),
    updateListenerInfo: (listenerId, info) =>
      updateListenerInfo(pool, listenerId, info)
  })
}

export default init
