import path from 'path'
import declareRuntimeEnv from '../../src/declare_runtime_env'

import alias from '../../src/alias/$resolve.readModels'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    readModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'files/testProjection.js'),
        resolvers: path.resolve(__dirname, 'files/testResolvers.js')
      }
    ],
    readModelAdapters: {
      Todos: {
        module: 'resolve-readmodel-lite',
        options: {}
      }
    }
  }

  test('[client]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
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

describe('base(v2) config works correctly', () => {
  const resolveConfig = {
    readModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'files/testProjection.js'),
        resolvers: path.resolve(__dirname, 'files/testResolvers.js')
      },
      {
        name: 'Items',
        projection: path.resolve(__dirname, 'files/testProjection.js'),
        resolvers: path.resolve(__dirname, 'files/testResolvers.js')
      }
    ],
    readModelAdapters: {
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
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
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
    readModelAdapters: {
      Todos: {
        module: declareRuntimeEnv('READ_MODEL_TODOS_ADAPTER'),
        options: {
          size: declareRuntimeEnv('READ_MODEL_TODOS_OPTIONS_SIZE')
        }
      }
    }
  }

  test('[client]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
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
