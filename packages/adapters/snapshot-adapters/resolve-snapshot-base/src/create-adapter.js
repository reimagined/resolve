export const withConnection = async (pool, connect, method, ...args) => {
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  if (pool.connectionPromise == null) {
    pool.connectionPromise = Promise.resolve().then(connect.bind(null, pool))
  }
  await pool.connectionPromise

  return await method(pool, ...args)
}

export const wrapDispose = async (dispose, pool, ...args) => {
  pool.disposed = true
  return await dispose(pool, ...args)
}

export const createAdapter = (
  { withConnection, wrapDispose },
  { connect, loadSnapshot, saveSnapshot, dropSnapshot, init, drop, dispose },
  imports,
  config
) => {
  const pool = { config, ...imports }
  const wrappedDispose = wrapDispose.bind(null, dispose)

  const api = {
    loadSnapshot: withConnection.bind(null, pool, connect, loadSnapshot),
    saveSnapshot: withConnection.bind(null, pool, connect, saveSnapshot),
    dropSnapshot: withConnection.bind(null, pool, connect, dropSnapshot),
    dispose: withConnection.bind(null, pool, connect, wrappedDispose),
    init: withConnection.bind(null, pool, connect, init),
    drop: withConnection.bind(null, pool, connect, drop)
  }

  return Object.freeze(api)
}

export default createAdapter.bind(null, {
  withConnection,
  wrapDispose
})
