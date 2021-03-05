import { validateReadModelConnectors } from '../src/validate_config'

describe('validateReadModelConnectors', () => {
  test('should works correctly', () => {
    const resolveConfig = {
      mode: 'development',
      readModels: [
        {
          name: 'first-read-model',
          connectorName: 'default',
          projection: 'common/read-models/first-read-model/projection.js',
          resolvers: 'common/read-models/first-read-model/resolvers.js',
        },
        {
          name: 'second-read-model',
          connectorName: 'default',
          projection: 'common/read-models/second-read-model/projection.js',
          resolvers: 'common/read-models/second-read-model/resolvers.js',
        },
        {
          name: 'third-read-model',
          connectorName: 'custom',
          projection: 'common/read-models/third-read-model/projection.js',
          resolvers: 'common/read-models/third-read-model/resolvers.js',
        },
      ],
      readModelConnectors: {
        default: {
          module: '@resolve-js/readmodel-lite',
          options: {},
        },
        custom: {
          module: '@resolve-js/readmodel-mysql',
          options: {},
        },
      },
      sagas: [],
    }

    expect(() => validateReadModelConnectors(resolveConfig)).not.toThrow()
  })

  // eslint-disable-next-line
  test('should throw error `The "${adapterName}" read model connector is required but not specified`', () => {
    const resolveConfig = {
      mode: 'development',
      readModels: [
        {
          name: 'read-model',
          connectorName: 'unknown',
          projection: 'common/read-models/third-read-model/projection.js',
          resolvers: 'common/read-models/third-read-model/resolvers.js',
        },
      ],
      readModelConnectors: {
        default: {
          module: '@resolve-js/readmodel-lite',
          options: {},
        },
      },
      sagas: [],
    }

    expect(() => validateReadModelConnectors(resolveConfig)).toThrow(
      new Error(
        `The "unknown" read model connector is required but not specified`
      )
    )
  })
})
