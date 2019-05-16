import makeAutoPromise from './make_auto_promise'

const wrapReadModel = (readModel, readModelConnectors, doUpdateRequest) => {
  let isDisposed = false
  const connector = readModelConnectors[readModel.connectorName]
  if (connector == null) {
    throw new Error(
      `Connector ${readModel.connectorName} for read-model ${
        readModel.name
      } does not exist`
    )
  }

  const connectionPromise = makeAutoPromise(async () => {
    if (typeof connector.connect === 'function') {
      return await connector.connect(readModel.name)
    }
    return null
  })

  const read = async (resolverName, resolverArgs, jwtToken) => {
    if (isDisposed) {
      throw new Error(`Read model "${readModel.name}" is disposed`)
    }
    if (typeof readModel.resolvers[resolverName] !== 'function') {
      throw new Error(`Resolver ${resolverName} does not exist`)
    }
    await doUpdateRequest(readModel.name)
    const connection = await connectionPromise

    return await readModel.resolvers[resolverName](
      connection,
      resolverArgs,
      jwtToken
    )
  }

  const updateByEvents = async events => {
    if (isDisposed) {
      throw new Error(`Read model "${readModel.name}" is disposed`)
    }

    const projection = readModel.projection

    if (projection == null) {
      throw new Error(
        `Updating by events is prohibited when "${
          readModel.name
        }" projection is not specified`
      )
    }

    let lastError = null
    let lastEvent = null

    try {
      for (const event of events) {
        if (isDisposed) {
          throw new Error(
            `Read model "${readModel.name}" updating had been interrupted`
          )
        }

        if (event != null && typeof projection[event.type] === 'function') {
          const connection = await connectionPromise
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
      listenerId: readModel.name,
      lastError,
      lastEvent
    }

    if (lastError != null) {
      throw result
    } else {
      return result
    }
  }

  const readAndSerialize = async (resolverName, resolverArgs, jwtToken) => {
    if (isDisposed) {
      throw new Error(`Read model "${readModel.name}" is disposed`)
    }

    const result = await read(resolverName, resolverArgs, jwtToken)

    return JSON.stringify(result, null, 2)
  }

  const drop = async () => {
    if (isDisposed) {
      throw new Error(`Read model "${readModel.name}" is disposed`)
    }
    if (typeof connector.drop !== 'function') {
      return
    }

    const connection = await connectionPromise
    await connector.drop(connection, readModel.name)
  }

  const dispose = async () => {
    if (isDisposed) {
      throw new Error(`Read model "${readModel.name}" is disposed`)
    }
    if (typeof connector.disconnect !== 'function') {
      return
    }

    const connection = await connectionPromise
    await connector.disconnect(connection, readModel.name)

    isDisposed = true
  }

  return Object.freeze({
    read,
    readAndSerialize,
    updateByEvents,
    drop,
    dispose
  })
}

export default wrapReadModel
