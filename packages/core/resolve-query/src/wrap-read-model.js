const maybeConnect = pool => {
  if (pool.hasOwnProperty('connectionPromise')) {
    return pool.connectionPromise
  }

  pool.connectionPromise = Promise.resolve(null)
  if (typeof pool.connector.connect === 'function') {
    pool.connectionPromise = pool.connector.connect(pool.readModel.name)
  }

  return pool.connectionPromise
}

const read = async (pool, resolverName, resolverArgs, jwtToken) => {
  if (pool.isDisposed) {
    throw new Error(`Read model "${pool.readModel.name}" is disposed`)
  }
  if (typeof pool.readModel.resolvers[resolverName] !== 'function') {
    throw new Error(`Resolver ${resolverName} does not exist`)
  }
  await pool.doUpdateRequest(pool.readModel.name)
  const connection = await maybeConnect(pool)

  return await pool.readModel.resolvers[resolverName](
    connection,
    resolverArgs,
    jwtToken
  )
}

const updateByEvents = async (pool, events) => {
  if (pool.isDisposed) {
    throw new Error(`Read model "${pool.readModel.name}" is disposed`)
  }

  const projection = pool.readModel.projection

  if (projection == null) {
    throw new Error(
      `Updating by events is prohibited when "${
        pool.readModel.name
      }" projection is not specified`
    )
  }

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
        const connection = await maybeConnect(pool)
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
  if (typeof pool.connector.drop !== 'function') {
    return
  }

  const connection = await maybeConnect(pool)
  await pool.connector.drop(connection, pool.readModel.name)
}

const dispose = async pool => {
  if (pool.isDisposed) {
    throw new Error(`Read model "${pool.readModel.name}" is disposed`)
  }
  if (typeof pool.connector.disconnect !== 'function') {
    return
  }

  const connection = await maybeConnect(pool)
  await pool.connector.disconnect(connection, pool.readModel.name)

  pool.isDisposed = true
}

const wrapReadModel = (readModel, readModelConnectors, doUpdateRequest) => {
  const connector = readModelConnectors[readModel.connectorName]
  if (connector == null) {
    throw new Error(
      `Connector ${readModel.connectorName} for read-model ${
        readModel.name
      } does not exist`
    )
  }

  const pool = {
    readModel,
    doUpdateRequest,
    isDisposed: false,
    connector
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
