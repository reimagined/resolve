import importStream from '../src/import'
import exportStream from '../src/export'

enum EventstoreAdapterStatus {
  created = 'created',
  connecting = 'connecting',
  ready = 'ready',
  disposed = 'disposed'
}

type EventstoreAdapterState<Connection> = {
  status: () => EventstoreAdapterStatus
  setConnection: (data: Connection) => void
  getConnection: () => Connection
}

type EventstoreAdapterImplementation<Connection> = {
  connect: () => Promise<Connection>
  loadEventsByCursor: Function
  loadEventsByTimestamp: Function
  getLatestEvent: Function
  saveEvent: Function
  init: Function
  drop: Function
  dispose: Function
  injectEvent: Function
  isFrozen: Function
  freeze: Function
  unfreeze: Function
  shapeEvent: Function
  loadSnapshot: Function
  saveSnapshot: Function
  dropSnapshot: Function
  getSecretsManager: Function
}

type EventstoreAdapter<Connection> = {
  state: EventstoreAdapterState<Connection>
} & EventstoreAdapterImplementation<Connection>

type EventstoreImplementationFactory<Connection> = (
  state: EventstoreAdapterState<Connection>
) => EventstoreAdapterImplementation<Connection>

function createAdapter<Connection>(
  implementationFactory: EventstoreImplementationFactory<Connection>
): EventstoreAdapter<Connection> {
  let status = EventstoreAdapterStatus.created
  let connection = undefined
  const state: EventstoreAdapterState<Connection> = {
    status(): EventstoreAdapterStatus {
      return status
    },
    getConnection: () => connection,
    setConnection: (data: Connection) => (connection = data)
  }
  const nakedImplementation = implementationFactory(state)

  const implementation = Object.keys(nakedImplementation).reduce(
    (impl, method) => {
      if (method !== 'connect') {
        impl[method] = async (...args): Promise<any> => {
          if (state.status() === EventstoreAdapterStatus.disposed) {
            throw new Error('Adapter has been already disposed')
          }

          if (state.status() === EventstoreAdapterStatus.created) {
            status = EventstoreAdapterStatus.connecting

            state.setConnection(await nakedImplementation.connect())

            status = EventstoreAdapterStatus.ready
          }

          return implementation[method](state.getConnection(), ...args)
        }
      }
      return impl
    },
    {}
  ) as EventstoreAdapterImplementation<Connection>

  return {
    state,
    ...implementation
  }
}
