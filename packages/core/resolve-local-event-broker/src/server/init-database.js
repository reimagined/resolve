const initDatabase = async pool => {
  const databaseFile = pool.config.databaseFile
  const database = await pool.sqlite.open(databaseFile)

  const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
  const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

  const serializedFields = {
    AbutTimestamp: { stringify: value => Number(value), parse: value => value },
    SkipCount: { stringify: value => Number(value), parse: value => value },
    LastError: {
      stringify: value => escape(JSON.stringify(value)),
      parse: value => JSON.parse(value)
    },
    LastEvent: {
      stringify: value => escape(JSON.stringify(value)),
      parse: value => JSON.parse(value)
    },
    Status: { stringify: value => escape(value), parse: value => value },
    Properties: {
      stringify: value => escape(JSON.stringify(value)),
      parse: value => JSON.parse(value)
    }
  }

  await database.exec(`PRAGMA busy_timeout=0`)
  await database.exec(`PRAGMA locking_mode=EXCLUSIVE`)
  await database.exec(`PRAGMA encoding=${escape('UTF-8')}`)

  try {
    // Exclusive lock via https://stackoverflow.com/a/34480741/7878274
    await database.exec(`BEGIN IMMEDIATE;`)
  } catch (err) {
    await database.close()
    throw new Error('Local Event Broker should be ran in single instance')
  }

  await database.exec(`
    CREATE TABLE IF NOT EXISTS ${escapeId('Listeners')} (
      ${escapeId('ListenerId')} VARCHAR(128) NOT NULL,
      ${escapeId('Status')} VARCHAR(128) NOT NULL DEFAULT ${escape('running')},
      ${escapeId('AbutTimestamp')} BIGINT NOT NULL DEFAULT 0,
      ${escapeId('SkipCount')} BIGINT NOT NULL DEFAULT 0,
      ${escapeId('Properties')} CLOB,
      ${escapeId('LastEvent')} CLOB,
      ${escapeId('LastError')} CLOB,
      PRIMARY KEY(${escapeId('ListenerId')})
    );
    COMMIT;
    BEGIN IMMEDIATE;
  `)

  const queueWrapper = pool.wrapWithQueue.bind(null, pool)

  Object.assign(pool, {
    rewindListener: queueWrapper.bind(null, pool.rewindListener),
    getListenerInfo: queueWrapper.bind(null, pool.getListenerInfo),
    updateListenerInfo: queueWrapper.bind(null, pool.updateListenerInfo),
    serializedFields,
    lockPromise: null,
    database,
    escapeId,
    escape
  })
}

export default initDatabase
