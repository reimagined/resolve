import path from 'path'
import declareRuntimeEnv from '../../src/declare_runtime_env'

import alias from '../../src/alias/$resolve.readModels'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    readModels: [
      {
        name: 'Todos',
        connectorName: 'Todos',
        projection: path.resolve(__dirname, 'files/testProjection.js'),
        resolvers: path.resolve(__dirname, 'files/testResolvers.js')
      }
    ],
    sagas: [],
    readModelConnectors: {
      Todos: {
        module: 'resolve-readmodel-lite',
        options: {}
      }
    }
  }

  test('[client]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toThrow()
  })

  test('[server]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})

test('should throw when read-model name is process.env', () => {
  expect(() =>
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            readModels: [
              {
                name: declareRuntimeEnv('Todos'),
                connectorName: 'Todos',
                projection: path.resolve(__dirname, 'files/testProjection.js'),
                resolvers: path.resolve(__dirname, 'files/testResolvers.js')
              }
            ]
          },
          isClient: true
        }).code +
        '\r\n'
    )
  ).toThrow()
})

test('should throw when read-model connectorName is process.env', () => {
  expect(() =>
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            readModels: [
              {
                name: 'Todos',
                connectorName: declareRuntimeEnv('Todos'),
                projection: path.resolve(__dirname, 'files/testProjection.js'),
                resolvers: path.resolve(__dirname, 'files/testResolvers.js')
              }
            ]
          },
          isClient: true
        }).code +
        '\r\n'
    )
  ).toThrow()
})

describe('base(v2) config works correctly', () => {
  const resolveConfig = {
    readModels: [
      {
        name: 'Todos',
        connectorName: 'Todos',
        projection: path.resolve(__dirname, 'files/testProjection.js'),
        resolvers: path.resolve(__dirname, 'files/testResolvers.js')
      },
      {
        name: 'Items',
        connectorName: 'Items',
        projection: {
          module: path.resolve(__dirname, 'files/testProjectionAsModule.js'),
          options: {},
          imports: {
            testCommandsAsModule: path.resolve(
              __dirname,
              'files/testCommandsAsModule.js'
            )
          }
        },
        resolvers: {
          module: path.resolve(__dirname, 'files/testResolversAsModule.js'),
          options: {},
          imports: {
            testCommandsAsModule: path.resolve(
              __dirname,
              'files/testCommandsAsModule.js'
            )
          }
        }
      }
    ],
    sagas: [],
    readModelConnectors: {
      Todos: {
        module: 'resolve-readmodel-lite',
        options: {}
      },
      Items: {
        module: 'resolve-readmodel-lite',
        options: {}
      }
    }
  }

  test('[client]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toThrow()
  })

  test('[server]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})

describe('config + process.env works correctly', () => {
  const resolveConfig = {
    readModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'files/testProjection.js'),
        resolvers: path.resolve(__dirname, 'files/testResolvers.js')
      }
    ],
    sagas: [],
    readModelConnectors: {
      Todos: {
        module: declareRuntimeEnv('READ_MODEL_TODOS_ADAPTER'),
        options: {
          size: declareRuntimeEnv('READ_MODEL_TODOS_OPTIONS_SIZE')
        }
      }
    }
  }

  test('[client]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toThrow()
  })

  test('[server]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})
