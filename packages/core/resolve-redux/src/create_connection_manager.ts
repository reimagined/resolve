const getAddedConnections = (
  prevConnections: any[],
  nextConnections: any[]
): any[] =>
  nextConnections.filter(
    connection =>
      !prevConnections.find(
        ({ connectionName, connectionId }) =>
          connection.connectionName === connectionName &&
          connection.connectionId === connectionId
      )
  )

const getRemovedConnections = (
  prevConnections: any[],
  nextConnections: any[]
): any[] =>
  prevConnections.filter(
    connection =>
      !nextConnections.find(
        ({ connectionName, connectionId }) =>
          connection.connectionName === connectionName &&
          connection.connectionId === connectionId
      )
  )

const getConnections = ({
  connections,
  wildcardSymbol
}: {
  connections: any[]
  wildcardSymbol: string | null
}) => {
  const result: any[] = []
  for (const connectionName in connections) {
    let connectionsByName = []
    for (const connectionId in connections[connectionName]) {
      if (connectionId === wildcardSymbol) {
        connectionsByName = [
          {
            connectionName,
            connectionId
          }
        ]
        break
      }
      connectionsByName.push({
        connectionName,
        connectionId
      })
    }
    result.push(...connectionsByName)
  }

  return result
}

const addConnection = (
  pool: any,
  {
    connectionName,
    connectionId
  }: {
    connectionName: string
    connectionId: any
  }
): any => {
  const prevConnections = getConnections(pool)

  if (!pool.connections[connectionName]) {
    pool.connections[connectionName] = Object.create(null)
  }
  if (!pool.connections[connectionName][connectionId]) {
    pool.connections[connectionName][connectionId] = 0
  }
  pool.connections[connectionName][connectionId]++

  const nextConnections = getConnections(pool)

  const addedConnections = getAddedConnections(prevConnections, nextConnections)
  const removedConnections = getRemovedConnections(
    prevConnections,
    nextConnections
  )

  return { addedConnections, removedConnections }
}

const removeConnection = (
  pool: any,
  {
    connectionName,
    connectionId
  }: {
    connectionName: string
    connectionId: any
  }
): any => {
  const prevConnections = getConnections(pool)

  pool.connections[connectionName][connectionId]--

  if (!pool.connections[connectionName][connectionId]) {
    delete pool.connections[connectionName][connectionId]
  }

  if (Object.keys(pool.connections[connectionName]).length === 0) {
    delete pool.connections[connectionName]
  }

  const nextConnections = getConnections(pool)

  const addedConnections = getAddedConnections(prevConnections, nextConnections)
  const removedConnections = getRemovedConnections(
    prevConnections,
    nextConnections
  )

  return { addedConnections, removedConnections }
}

const createConnectionManager = (
  {
    wildcardSymbol = '*'
  }: {
    wildcardSymbol: string | null | undefined
  } = { wildcardSymbol: undefined }
) => {
  const pool = {
    connections: Object.create(null),
    wildcardSymbol
  }

  return {
    addConnection: addConnection.bind(null, pool),
    removeConnection: removeConnection.bind(null, pool),
    getConnections: getConnections.bind(null, pool)
  }
}

export default createConnectionManager
