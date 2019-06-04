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
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('read') : null
  try {
    const readModelName = pool.readModel.name
    if (pool.isDisposed) {
      throw new Error(`Read model "${readModelName}" is disposed`)
    }
    if (typeof pool.readModel.resolvers[resolverName] !== 'function') {
      const error = new Error(`Resolver "${resolverName}" does not exist`)
      error.code = 422
      throw error
    }
    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('resolverName', resolverName)
    }
    await pool.doUpdateRequest(readModelName)
    const connection = await maybeConnect(pool)

    return await pool.readModel.resolvers[resolverName](
      connection,
      resolverArgs,
      jwtToken
    )
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const updateByEvents = async (pool, events) => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('updateByEvents') : null

  try {
    const readModelName = pool.readModel.name

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('eventCount', events.length)
    }

    if (pool.isDisposed) {
      throw new Error(`Read model "${readModelName}" is disposed`)
    }

    const projection = pool.readModel.projection

    if (projection == null) {
      throw new Error(
        `Updating by events is prohibited when "${readModelName}" projection is not specified`
      )
    }

    let lastError = null
    let lastEvent = null

    try {
      for (const event of events) {
        if (pool.isDisposed) {
          throw new Error(
            `Read model "${readModelName}" updating had been interrupted`
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
      listenerId: readModelName,
      lastError,
      lastEvent
    }

    if (lastError != null) {
      throw result
    } else {
      return result
    }
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const readAndSerialize = async (pool, resolverName, resolverArgs, jwtToken) => {
  const readModelName = pool.readModel.name

  if (pool.isDisposed) {
    throw new Error(`Read model "${readModelName}" is disposed`)
  }

  const result = await read(pool, resolverName, resolverArgs, jwtToken)

  return JSON.stringify(result, null, 2)
}

const drop = async pool => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('drop') : null

  try {
    const readModelName = pool.readModel.name

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
    }

    if (pool.isDisposed) {
      throw new Error(`Read model "${readModelName}" is disposed`)
    }
    if (typeof pool.connector.drop !== 'function') {
      return
    }

    const connection = await maybeConnect(pool)
    await pool.connector.drop(connection, readModelName)
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const dispose = async pool => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('dispose') : null

  try {
    const readModelName = pool.readModel.name

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
    }

    if (pool.isDisposed) {
      throw new Error(`Read model "${readModelName}" is disposed`)
    }
    pool.isDisposed = true

    if (typeof pool.connector.disconnect !== 'function') {
      return
    }

    const connection = await maybeConnect(pool)
    await pool.connector.disconnect(connection, readModelName)
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const wrapReadModel = (
  readModel,
  readModelConnectors,
  doUpdateRequest,
  performanceTracer
) => {
  const connector = readModelConnectors[readModel.connectorName]
  if (connector == null) {
    throw new Error(
      `Connector "${readModel.connectorName}" for read-model "${
        readModel.name
      }" does not exist`
    )
  }

  const pool = {
    readModel,
    doUpdateRequest,
    isDisposed: false,
    connector,
    performanceTracer
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
