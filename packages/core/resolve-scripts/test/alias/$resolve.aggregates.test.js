import path from 'path'
import declareRuntimeEnv from '../../src/core/declare_runtime_env'

import alias from '../../src/core/alias/$resolve.aggregates'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'files/testCommands.js')
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
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'files/testCommands.js')
      },
      {
        name: 'Item',
        commands: path.resolve(__dirname, 'files/testCommands.js')
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

describe('config with projection works correctly', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'files/testCommands.js'),
        projection: path.resolve(__dirname, 'files/testProjection.js')
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

describe('config with snapshot works correctly', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'files/testCommands.js'),
        snapshotAdapter: {
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

describe('config with snapshot + process.env works correctly', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'files/testCommands.js'),
        snapshotAdapter: {
          module: declareRuntimeEnv('AGGREGATE_TODO_SNAPSHOT_ADAPTER'),
          options: {
            size: declareRuntimeEnv('AGGREGATE_TODO_SNAPSHOT_OPTIONS_SIZE')
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
