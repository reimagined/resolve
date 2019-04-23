import sqlite from 'sqlite'

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const dispose = async ({ database }, dropInfo) => {
  if (dropInfo) {
    await database.exec(`
			DROP TABLE ${escapeId('Listeners')};
			COMMIT;
		`)
  }
  await database.close()
}

const rewindListener = async ({ database }, listenerId) => {
  await database.exec(`
	  DELETE FROM ${escapeId('Listeners')} WHERE ${escapeId(
    'ListenerId'
  )} = ${escape(listenerId)};
	  COMMIT;
	  BEGIN IMMEDIATE;
  `)
}

const getListenerInfo = async ({ database }, listenerId) => {
  return await database.get(`
    SELECT ${escapeId('AbutTimestamp')}, ${escapeId('SkipCount')}, ${escapeId(
    'LastEvent'
  )}, ${escapeId('LastError')}, ${escapeId('Status')}
    FROM ${escapeId('Listeners')}
    WHERE ${escapeId('ListenerId')} = ${escape(listenerId)}
  `)
}

const updateListenerInfo = async ({ database }, listenerId, values) => {
  const fieldNames = [escapeId('ListenerId')]
  const fieldValues = [escape(listenerId)]

  if (values.hasOwnProperty('AbutTimestamp')) {
    fieldNames.push(escapeId('AbutTimestamp'))
    fieldValues.push(Number(values.AbutTimestamp))
  }

  if (values.hasOwnProperty('SkipCount')) {
    fieldNames.push(escapeId('SkipCount'))
    fieldValues.push(Number(values.SkipCount))
  }

  if (values.hasOwnProperty('LastError')) {
    fieldNames.push(escapeId('LastError'))
    fieldValues.push(escape(values.LastError))
  }

  if (values.hasOwnProperty('LastEvent')) {
    fieldNames.push(escapeId('LastEvent'))
    fieldValues.push(escape(values.LastEvent))
  }

  if (values.hasOwnProperty('Status')) {
    fieldNames.push(escapeId('Status'))
    fieldValues.push(escape(values.Status))
  }

  await database.exec(`
    INSERT OR REPLACE INTO ${escapeId('Listeners')}(
      ${fieldNames.join(', ')}
    ) VALUES(
      ${fieldValues.join(', ')}
    );
    COMMIT;
    BEGIN IMMEDIATE;
  `)
}

const init = async ({ databaseFile }) => {
  const database = await sqlite.open(databaseFile)
  await database.exec(`PRAGMA busy_timeout=0`)
  await database.exec(`PRAGMA locking_mode=EXCLUSIVE`)

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
			${escapeId('LastEvent')} CLOB,
      ${escapeId('LastError')} CLOB,
		  PRIMARY KEY(${escapeId('ListenerId')})
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
