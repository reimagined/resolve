import path from 'path'
import { extractEnv } from 'json-env-extract'

import alias from '../../src/core/alias/$resolve.readModels'

describe('base config works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      readModels: [
        {
          name: 'Todos',
          projection: "${path.resolve(__dirname, 'files/testProjection.js')}",
          resolvers: "${path.resolve(__dirname, 'files/testResolvers.js')}"
        }
      ]
    }
  `)

  test('[client]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: true
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })
})

describe('base(v2) config works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      readModels: [
        {
          name: 'Todos',
          projection: "${path.resolve(__dirname, 'files/testProjection.js')}",
          resolvers: "${path.resolve(__dirname, 'files/testResolvers.js')}"
        },
        {
          name: 'Items',
          projection: "${path.resolve(__dirname, 'files/testProjection.js')}",
          resolvers: "${path.resolve(__dirname, 'files/testResolvers.js')}"
        }
      ]
    }
  `)

  test('[client]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: true
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })
})

describe('config with storage works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      readModels: [
        {
          name: 'Todos',
          projection: "${path.resolve(__dirname, 'files/testProjection.js')}",
          resolvers: "${path.resolve(__dirname, 'files/testResolvers.js')}",
          storage: {
            adapter: "${path.resolve(
              __dirname,
              'files/testSnapshotAdapter.js'
            )}",
            options: {
              size: 100
            }
          }
        }
      ]
    }
  `)

  test('[client]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: true
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })
})

describe('config with storage + process.env works correctly', () => {
  const resolveConfig = extractEnv(`{
    readModels: [
      {
        name: 'Todos',
        projection: "${path.resolve(__dirname, 'files/testProjection.js')}",
        resolvers: "${path.resolve(__dirname, 'files/testResolvers.js')}",
        storage: {
          adapter: process.env.READ_MODEL_TODOS_ADAPTER,
          options: {
            size: process.env.READ_MODEL_TODOS_OPTIONS_SIZE
          }
        }
      }
    ]
  }`)

  test('[client]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: true
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })
})
