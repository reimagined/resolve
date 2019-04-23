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

const fields = {
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
  Status: { stringify: value => escape(value), parse: value => value }
}

const getListenerInfo = async ({ database }, listenerId) => {
  const result = await database.get(`
    SELECT ${Object.keys(fields)
      .map(escapeId)
      .join(', ')} 
    FROM ${escapeId('Listeners')}
    WHERE ${escapeId('ListenerId')} = ${escape(listenerId)}
  `)

  if (result == null) {
    return null
  }

  for (const fieldName of Object.keys(fields)) {
    result[fieldName] = fields[fieldName].parse(result[fieldName])
  }

  return result
}

const updateListenerInfo = async ({ database }, listenerId, nextValues) => {
  const prevValues = await getListenerInfo({ database }, listenerId)
  for (const key of Object.keys(nextValues)) {
    if (nextValues[key] == null) {
      delete nextValues[key]
    }
  }

  const values =
    prevValues != null ? { ...prevValues, ...nextValues } : nextValues

  await database.exec(`
    REPLACE INTO ${escapeId('Listeners')}(
      ${escapeId('ListenerId')}, ${Object.keys(values)
    .map(escapeId)
    .join(', ')}
    ) VALUES(
      ${escape(listenerId)}, ${Object.keys(values)
    .map(key => fields[key].stringify(values[key]))
    .join(', ')}
    );
    COMMIT;
    BEGIN IMMEDIATE;
  `)
}

const wrapWithQueue = (pool, method) => async (...args) => {
  while (Promise.resolve(pool.lockPromise) === pool.lockPromise) {
    await pool.lockPromise
  }

  pool.lockPromise = new Promise(resolve => {
    pool.unlockConnection = () => {
      pool.lockPromise = null
      resolve()
    }
  })

  try {
    return await method(pool, ...args)
  } finally {
    pool.unlockConnection()
  }
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

  const pool = { database, lockPromise: null }

  return Object.freeze({
    dispose: dispose.bind(null, pool),
    rewindListener: wrapWithQueue(pool, rewindListener),
    getListenerInfo: wrapWithQueue(pool, getListenerInfo),
    updateListenerInfo: wrapWithQueue(pool, updateListenerInfo)
  })
}

export default init
