import defaultStorageAdapter from 'resolve-storage-lite'
import defaultBusAdapter from 'resolve-bus-memory'

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_SERVER_CONFIG'

const defaultConfig = {
  ssrMode: 'none',
  bus: {
    adapter: defaultBusAdapter
  },
  storage: {
    adapter: defaultStorageAdapter
  },
  initialState: () => Promise.resolve({}),
  aggregates: [],
  initialSubscribedEvents: { types: [], ids: [] },
  filterSubscription: eventDescription => eventDescription,
  auth: {
    strategies: []
  },
  jwtCookie: {
    name: 'JWT-COOKIE',
    maxAge: 3600,
    httpOnly: true
  },
  readModels: [],
  viewModels: [],
  extendExpress: null,
  sagas: []
}

function extendConfig(inputConfig, defaultConfig) {
  const config = { ...inputConfig }

  Object.keys(defaultConfig).forEach(key => {
    if (!config[key]) {
      config[key] = defaultConfig[key]
    } else if (
      defaultConfig[key] !== null &&
      defaultConfig[key].constructor === Object
    ) {
      Object.keys(defaultConfig[key]).forEach(innerKey => {
        if (!config[key][innerKey]) {
          config[key][innerKey] = defaultConfig[key][innerKey]
        }
      })
    }
  })

  return config
}

export default extendConfig(config, defaultConfig)
