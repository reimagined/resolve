import merge from './merge'

const inject_resetter = resolveConfig => {
  Object.assign(
    resolveConfig,
    merge(resolveConfig, {
      apiHandlers: [
        {
          method: 'GET',
          path: 'reset-domain',
          controller: {
            module:
              'resolve-runtime/lib/common/handlers/reset-domain-handler.js',
            options: {
              storageAdapterOptions: resolveConfig.storageAdapter.options,
              snapshotAdapterOptions: resolveConfig.snapshotAdapter.options,
              readModelConnectorsOptions: Object.keys(
                resolveConfig.readModelConnectors
              ).reduce((acc, name) => {
                if (
                  resolveConfig.readModelConnectors[name].constructor !== String
                ) {
                  acc[name] = resolveConfig.readModelConnectors[name].options
                } else {
                  acc[name] = null
                }
                return acc
              }, {}),
              readModels: resolveConfig.readModels.map(
                ({ name, connectorName }) => ({ name, connectorName })
              ),
              sagas: resolveConfig.sagas.map(({ name, connectorName }) => ({
                name,
                connectorName
              })),
              eventBroker: resolveConfig.eventBroker
            },
            imports: {
              storageAdapterModule: resolveConfig.storageAdapter.module,
              snapshotAdapterModule: resolveConfig.snapshotAdapter.module,
              ...Object.keys(resolveConfig.readModelConnectors).reduce(
                (acc, name) => {
                  const connector = resolveConfig.readModelConnectors[name]
                  if (connector.constructor === String) {
                    acc[`readModelConnector_${name}`] = connector
                  } else if (connector.module == null) {
                    acc[`readModelConnector_${name}`] =
                      'resolve-runtime/lib/common/defaults/read-model-connector.js'
                  } else {
                    acc[`readModelConnector_${name}`] = connector.module
                  }
                  return acc
                },
                {}
              )
            }
          }
        }
      ]
    })
  )
}

export default inject_resetter
