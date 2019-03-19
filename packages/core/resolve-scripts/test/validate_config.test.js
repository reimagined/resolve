import { validateReadModelConnectors } from '../src/validate_config'

describe('validateReadModelConnectors', () => {
  test('should works correctly', () => {
    const resolveConfig = {
      readModels: [
        {
          name: 'first-read-model',
          connectorName: 'default',
          projection: 'common/read-models/first-read-model/projection.js',
          resolvers: 'common/read-models/first-read-model/resolvers.js'
        },
        {
          name: 'second-read-model',
          connectorName: 'default',
          projection: 'common/read-models/second-read-model/projection.js',
          resolvers: 'common/read-models/second-read-model/resolvers.js'
        },
        {
          name: 'third-read-model',
          connectorName: 'custom',
          projection: 'common/read-models/third-read-model/projection.js',
          resolvers: 'common/read-models/third-read-model/resolvers.js'
        }
      ],
      readModelConnectors: {
        default: {
          module: 'resolve-readmodel-lite',
          options: {}
        },
        custom: {
          module: 'resolve-readmodel-mysql',
          options: {}
        }
      }
    }

    expect(() => validateReadModelConnectors(resolveConfig)).not.toThrow()
  })

  // eslint-disable-next-line
  test('should throw error `The "${adapterName}" read model adapter is required but not specified`', () => {
    const resolveConfig = {
      readModels: [
        {
          name: 'read-model',
          connectorName: 'unknown',
          projection: 'common/read-models/third-read-model/projection.js',
          resolvers: 'common/read-models/third-read-model/resolvers.js'
        }
      ],
      readModelConnectors: {
        default: {
          module: 'resolve-readmodel-lite',
          options: {}
        }
      }
    }

    expect(() => validateReadModelConnectors(resolveConfig)).toThrow(
      new Error(
        `The "unknown" read model adapter is required but not specified`
      )
    )
  })
})
