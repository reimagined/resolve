import { validateReadModelAdapters } from '../src/validate_config'

describe('validateReadModelAdapters', () => {
  test('should works correctly', () => {
    const resolveConfig = {
      readModels: [
        {
          name: 'first-read-model',
          adapterName: 'default',
          projection: 'common/read-models/first-read-model/projection.js',
          resolvers: 'common/read-models/first-read-model/resolvers.js'
        },
        {
          name: 'second-read-model',
          adapterName: 'default',
          projection: 'common/read-models/second-read-model/projection.js',
          resolvers: 'common/read-models/second-read-model/resolvers.js'
        },
        {
          name: 'third-read-model',
          adapterName: 'custom',
          projection: 'common/read-models/third-read-model/projection.js',
          resolvers: 'common/read-models/third-read-model/resolvers.js'
        }
      ],
      readModelAdapters: [
        {
          name: 'default',
          module: 'resolve-readmodel-memory',
          options: {}
        },
        {
          name: 'custom',
          module: 'resolve-readmodel-mysql',
          options: {}
        }
      ]
    }

    expect(() => validateReadModelAdapters(resolveConfig)).not.toThrow()
  })

  // eslint-disable-next-line
  test('should throw error `The "${adapterName}" read model adapter is required but not specified`', () => {
    const resolveConfig = {
      readModels: [
        {
          name: 'read-model',
          adapterName: 'unknown',
          projection: 'common/read-models/third-read-model/projection.js',
          resolvers: 'common/read-models/third-read-model/resolvers.js'
        }
      ],
      readModelAdapters: [
        {
          name: 'default',
          module: 'resolve-readmodel-memory',
          options: {}
        }
      ]
    }

    expect(() => validateReadModelAdapters(resolveConfig)).toThrow(
      new Error(
        `The "unknown" read model adapter is required but not specified`
      )
    )
  })

  // eslint-disable-next-line
  test('should throw error `Duplicate declaration "${adapterName}" read model adapter`', () => {
    const resolveConfig = {
      readModels: [
        {
          name: 'read-model',
          adapterName: 'default',
          projection: 'common/read-models/third-read-model/projection.js',
          resolvers: 'common/read-models/third-read-model/resolvers.js'
        }
      ],
      readModelAdapters: [
        {
          name: 'default',
          module: 'resolve-readmodel-memory',
          options: {}
        },
        {
          name: 'default',
          module: 'resolve-readmodel-mysql',
          options: {}
        }
      ]
    }

    expect(() => validateReadModelAdapters(resolveConfig)).toThrow(
      new Error(`Duplicate declaration "default" read model adapter`)
    )
  })

  // eslint-disable-next-line
  test('should throw error `Duplicate declaration "${adapterName}" read model adapter`', () => {
    const resolveConfig = {
      readModels: [
        {
          name: 'read-model',
          adapterName: 'default',
          projection: 'common/read-models/third-read-model/projection.js',
          resolvers: 'common/read-models/third-read-model/resolvers.js'
        }
      ],
      readModelAdapters: [
        {
          name: 'default',
          module: 'resolve-readmodel-memory',
          options: {}
        },
        {
          name: 'custom',
          module: 'resolve-readmodel-mysql',
          options: {}
        }
      ]
    }

    expect(() => validateReadModelAdapters(resolveConfig)).toThrow(
      new Error(
        `The "custom" read model adapter is specified but no read model uses it`
      )
    )
  })
})
