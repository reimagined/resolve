import path from 'path'

import alias from '../../src/core/alias/$resolve.viewModels'

describe('base config works correctly', () => {
  const resolveConfig = {
    viewModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'testProjection.js')
      }
    ]
  }

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
  const resolveConfig = {
    viewModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'testProjection.js')
      },
      {
        name: 'Items',
        projection: path.resolve(__dirname, 'testProjection.js')
      }
    ]
  }

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

describe('config with serializeState/deserialzeState works correctly', () => {
  const resolveConfig = {
    viewModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'testProjection.js'),
        serializeState: path.resolve(__dirname, 'testSerializeState.js'),
        deserializeState: path.resolve(__dirname, 'testDeserializeState.js')
      }
    ]
  }

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

describe('config with snapshot works correctly', () => {
  const resolveConfig = {
    viewModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'testProjection.js'),
        snapshot: {
          adapter: path.resolve(__dirname, 'testSnapshotAdapter.js'),
          options: {
            size: 100
          }
        }
      }
    ]
  }

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

describe('config with validator works correctly', () => {
  const resolveConfig = {
    viewModels: [
      {
        name: 'Todos',
        projection: path.resolve(__dirname, 'testProjection.js'),
        validator: path.resolve(__dirname, 'testValidator.js')
      }
    ]
  }

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
