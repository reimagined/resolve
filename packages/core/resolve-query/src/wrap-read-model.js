const read = async (pool, resolverName, resolverArgs, jwtToken) => {
  if (pool.isDisposed) {
    throw new Error(`Read model "${pool.readModel.name}" is disposed`)
  }
  if (typeof pool.readModel.resolvers[resolverName] !== 'function') {
    const error = new Error(`Resolver "${resolverName}" does not exist`)
    error.code = 422
    throw error
  }
  await pool.doUpdateRequest(pool.readModel.name)

  const connection = await pool.connector.connect(pool.readModel.name)
  pool.connections.add(connection)

  try {
    return await pool.readModel.resolvers[resolverName](
      connection,
      resolverArgs,
      jwtToken
    )
  } finally {
    await pool.connector.disconnect(connection, pool.readModel.name)

    pool.connections.delete(connection)
  }
}

const updateByEvents = async (pool, events) => {
  if (pool.isDisposed) {
    throw new Error(`Read model "${pool.readModel.name}" is disposed`)
  }

  const projection = pool.readModel.projection

  if (projection == null) {
    throw new Error(
      `Updating by events is prohibited when "${pool.readModel.name}" projection is not specified`
    )
  }

  const connection = await pool.connector.connect(pool.readModel.name)
  pool.connections.add(connection)

  let lastError = null
  let lastEvent = null

  try {
    for (const event of events) {
      if (pool.isDisposed) {
        throw new Error(
          `Read model "${pool.readModel.name}" updating had been interrupted`
        )
      }

      if (event != null && typeof projection[event.type] === 'function') {
        const executor = projection[event.type]
        await executor(connection, event)
        lastEvent = event
      }
    }
  } catch (error) {
    lastError = Object.create(Error.prototype, {
      message: { value: error.message, enumerable: true },
      stack: { value: error.stack, enumerable: true }
    })
  } finally {
    await pool.connector.disconnect(connection, pool.readModel.name)

    pool.connections.delete(connection)
  }

  const result = {
    listenerId: pool.readModel.name,
    lastError,
    lastEvent
  }

  if (lastError != null) {
    throw result
  } else {
    return result
  }
}

const readAndSerialize = async (pool, resolverName, resolverArgs, jwtToken) => {
  if (pool.isDisposed) {
    throw new Error(`Read model "${pool.readModel.name}" is disposed`)
  }

  const result = await read(pool, resolverName, resolverArgs, jwtToken)

  return JSON.stringify(result, null, 2)
}

const drop = async pool => {
  if (pool.isDisposed) {
    throw new Error(`Read model "${pool.readModel.name}" is disposed`)
  }

  const connection = await pool.connector.connect(pool.readModel.name)
  pool.connections.add(connection)

  try {
    await pool.connector.drop(connection, pool.readModel.name)
  } finally {
    await pool.connector.disconnect(connection, pool.readModel.name)

    pool.connections.delete(connection)
  }
}

const dispose = async pool => {
  if (pool.isDisposed) {
    throw new Error(`Read model "${pool.readModel.name}" is disposed`)
  }
  pool.isDisposed = true

  for (const connection of pool.connections) {
    await pool.connector.dispose(connection)
  }
}

const wrapReadModel = (readModel, readModelConnectors, doUpdateRequest) => {
  const connectorFactory = readModelConnectors[readModel.connectorName]
  if (connectorFactory == null) {
    throw new Error(
      `Connector "${readModel.connectorName}" for read-model "${readModel.name}" does not exist`
    )
  }
  const connector = connectorFactory()

  const pool = {
    connections: new Set(),
    readModel,
    doUpdateRequest,
    connector,
    isDisposed: false
  }

  return Object.freeze({
    read: read.bind(null, pool),
    readAndSerialize: readAndSerialize.bind(null, pool),
    updateByEvents: updateByEvents.bind(null, pool),
    drop: drop.bind(null, pool),
    dispose: dispose.bind(null, pool)
  })
}

export default wrapReadModel
