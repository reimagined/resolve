const getAddedConnections = (prevConnections, nextConnections) =>
  nextConnections.filter(
    connection =>
      !prevConnections.find(
        ({ connectionName, connectionId }) =>
          connection.connectionName === connectionName &&
          connection.connectionId === connectionId
      )
  )

const getRemovedConnections = (prevConnections, nextConnections) =>
  prevConnections.filter(
    connection =>
      !nextConnections.find(
        ({ connectionName, connectionId }) =>
          connection.connectionName === connectionName &&
          connection.connectionId === connectionId
      )
  )

const connectionManager = ({ wildcardSymbol = '*' } = {}) => {
  const connections = Object.create(null)

  const getConnections = () => {
    const result = []
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
      result.push.apply(result, connectionsByName)
    }

    return result
  }

  return {
    addConnection({ connectionName, connectionId }) {
      const prevConnections = getConnections()

      if (!connections[connectionName]) {
        connections[connectionName] = Object.create(null)
      }
      if (!connections[connectionName][connectionId]) {
        connections[connectionName][connectionId] = 0
      }
      connections[connectionName][connectionId]++

      const nextConnections = getConnections()

      const addedConnections = getAddedConnections(
        prevConnections,
        nextConnections
      )
      const removedConnections = getRemovedConnections(
        prevConnections,
        nextConnections
      )

      return { addedConnections, removedConnections }
    },

    removeConnection({ connectionName, connectionId }) {
      const prevConnections = getConnections()

      connections[connectionName][connectionId]--

      if (!connections[connectionName][connectionId]) {
        delete connections[connectionName][connectionId]
      }

      if (Object.keys(connections[connectionName]).length === 0) {
        delete connections[connectionName]
      }

      const nextConnections = getConnections()

      const addedConnections = getAddedConnections(
        prevConnections,
        nextConnections
      )
      const removedConnections = getRemovedConnections(
        prevConnections,
        nextConnections
      )

      return { addedConnections, removedConnections }
    }
  }
}

export default connectionManager
