import path from 'path'
import declareRuntimeEnv, { injectRuntimeEnv } from '../src/declare_runtime_env'

import alias from '../../src/core/alias/$resolve.readModels'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    readModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'files/testProjection.js'),
        resolvers: path.resolve(__dirname, 'files/testResolvers.js')
      }
    ]
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
    ]
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

describe('config with storage works correctly', () => {
  const resolveConfig = {
    readModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'files/testProjection.js'),
        resolvers: path.resolve(__dirname, 'files/testResolvers.js'),
        adapter: {
          module: path.resolve(__dirname, 'files/testSnapshotAdapter.js'),
          options: {
            size: 100
          }
        }
      }
    ]
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

describe('config with storage + process.env works correctly', () => {
  const resolveConfig = {
    readModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'files/testProjection.js'),
        resolvers: path.resolve(__dirname, 'files/testResolvers.js'),
        adapter: {
          module: declareRuntimeEnv('READ_MODEL_TODOS_ADAPTER'),
          options: {
            size: declareRuntimeEnv('READ_MODEL_TODOS_OPTIONS_SIZE')
          }
        }
      }
    ]
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
