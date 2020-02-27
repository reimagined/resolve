import createConnectionManager from '../create_connection_manager'

describe('createConnectionManager', () => {
  test('instance created', () => {
    const connectionManager = createConnectionManager()
    expect(connectionManager.getConnections()).toEqual([])
    connectionManager.destroy()
  })

  test('instance is singletone', () => {
    const connectionManager = createConnectionManager()
    const anotherConnectionManager = createConnectionManager()
    expect(connectionManager).toEqual(anotherConnectionManager)
    connectionManager.destroy()
  })

  test('connections added', () => {
    const connectionManager = createConnectionManager()
    connectionManager.addConnection({ connectionName: 'connection-name-1', connectionId: 'connection-id-1' })

    const anotherConnectionManager = createConnectionManager()
    const result = anotherConnectionManager.addConnection({
      connectionName: 'connection-name-2',
      connectionId: 'connection-id-2'
    })

    expect(connectionManager.getConnections()).toEqual([
      {
        connectionId: 'connection-id-1',
        connectionName: 'connection-name-1'
      },
      {
        connectionId: 'connection-id-2',
        connectionName: 'connection-name-2'
      }
    ])

    expect(result.addedConnections).toEqual([
      {
        connectionId: 'connection-id-2',
        connectionName: 'connection-name-2'
      }
    ])
    connectionManager.destroy()
  })

  test('connections removed', () => {
    const connectionManager = createConnectionManager()
    connectionManager.addConnection({ connectionName: 'connection-name-1', connectionId: 'connection-id-1' })

    const anotherConnectionManager = createConnectionManager()
    anotherConnectionManager.addConnection({
      connectionName: 'connection-name-2',
      connectionId: 'connection-id-2'
    })

    expect(connectionManager.getConnections()).toEqual([
      {
        connectionId: 'connection-id-1',
        connectionName: 'connection-name-1'
      },
      {
        connectionId: 'connection-id-2',
        connectionName: 'connection-name-2'
      }
    ])

    const result = anotherConnectionManager.removeConnection({
      connectionName: 'connection-name-2',
      connectionId: 'connection-id-2'
    })

    expect(result.removedConnections).toEqual([
      {
        connectionName: 'connection-name-2',
        connectionId: 'connection-id-2'
      }
    ])
    expect(connectionManager.getConnections()).toEqual([
      {
        connectionId: 'connection-id-1',
        connectionName: 'connection-name-1'
      }
    ])
    connectionManager.destroy()
  })

  test('connections with same indices added', () => {
    const connectionManager = createConnectionManager({ wildcardSymbol: 'symbol' })
    connectionManager.addConnection({ connectionName: 'connection-name-1', connectionId: 'connection-id-1' })
    connectionManager.addConnection({ connectionName: 'connection-name-1', connectionId: 'connection-id-1' })

    expect(connectionManager.getConnections()).toEqual([
      {
        connectionId: 'connection-id-1',
        connectionName: 'connection-name-1'
      }
    ])

    connectionManager.removeConnection({
      connectionName: 'connection-name-1',
      connectionId: 'connection-id-1'
    })

    expect(connectionManager.getConnections()).toEqual([
      {
        connectionId: 'connection-id-1',
        connectionName: 'connection-name-1'
      }
    ])

    connectionManager.removeConnection({
      connectionName: 'connection-name-1',
      connectionId: 'connection-id-1'
    })

    expect(connectionManager.getConnections()).toEqual([])

    connectionManager.destroy()
  })
})
