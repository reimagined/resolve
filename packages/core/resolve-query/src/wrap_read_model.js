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
      throw new Error('Read model is disposed')
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
      throw new Error('Read model is disposed')
    }
    if (readModel.projection == null) {
      throw new Error(
        'Updating by events is prohibited when projection is not specified'
      )
    }

    for (const event of events) {
      if (isDisposed) {
        throw new Error('Read model updating had been interrupted')
      }

      if (
        event != null &&
        typeof readModel.projection[event.type] === 'function'
      ) {
        const connection = await connectionPromise
        await readModel.projection[event.type](connection, event)
      }
    }
  }

  const readAndSerialize = async (resolverName, resolverArgs, jwtToken) => {
    if (isDisposed) {
      throw new Error('Read model is disposed')
    }

    const result = await read(resolverName, resolverArgs, jwtToken)

    return JSON.stringify(result, null, 2)
  }

  const drop = async () => {
    if (isDisposed) {
      throw new Error('Read model is disposed')
    }

    await connector.drop(readModel.name)
  }

  const dispose = async () => {
    if (isDisposed) {
      throw new Error('Read model is disposed')
    }

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
