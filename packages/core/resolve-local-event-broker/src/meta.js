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

const fields = {
  AbutTimestamp: value => Number(value),
  SkipCount: value => Number(value),
  LastError: value => escape(JSON.stringify(value)),
  LastEvent: value => escape(JSON.stringify(value)),
  Status: value => escape(value)
}

const updateListenerInfo = async ({ database }, listenerId, nextValues) => {
  const prevValues = await database.get(`
    SELECT ${Object.keys(fields)
      .map(escapeId)
      .join(', ')} 
    FROM ${escapeId('Listeners')}
    WHERE ${escapeId('ListenerId')} = ${escape(listenerId)}
  `)

  const values =
    prevValues != null
      ? {
          ...prevValues,
          ...nextValues
        }
      : nextValues

  await database.exec(`
    INSERT OR REPLACE INTO ${escapeId('Listeners')}(
      ${escapeId('ListenerId')}, ${Object.keys(values)
    .map(escapeId)
    .join(', ')}
    ) VALUES(
      ${escape(listenerId)}, ${Object.keys(values)
    .map(key => fields[key](values[key]))
    .join(', ')}
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
    dispose: dispose.bind(null, pool),
    rewindListener: rewindListener.bind(null, pool),
    getListenerInfo: getListenerInfo.bind(null, pool),
    updateListenerInfo: updateListenerInfo.bind(null, pool)
  })
}

export default init
