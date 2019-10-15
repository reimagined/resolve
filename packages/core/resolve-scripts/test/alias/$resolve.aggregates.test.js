import path from 'path'

import alias from '../../src/alias/$resolve.aggregates'
import normalizePaths from './normalize_paths'
import declareRuntimeEnv from '../../src/declare_runtime_env'

let DateNow

beforeAll(() => {
  DateNow = global.Date.now
  global.Date.now = () => 1558692234758116346975
})

afterAll(() => {
  global.Date.now = DateNow
})

describe('base config works correctly', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'files/testCommands.js')
      }
    ],
    schedulers: {}
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

test('when aggregate name is process.env', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: declareRuntimeEnv('name'),
        commands: path.resolve(__dirname, 'files/testCommands.js')
      }
    ],
    schedulers: {}
  }

  expect(() =>
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    )
  ).toThrow()
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
    ],
    schedulers: {}
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

describe('config with projection works correctly', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'files/testCommands.js'),
        projection: path.resolve(__dirname, 'files/testProjection.js')
      }
    ],
    schedulers: {}
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

describe('config with commands as module works correctly', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: 'Todo',
        commands: {
          module: path.resolve(__dirname, 'files/testCommandsAsModule.js'),
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
    schedulers: {}
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

describe('config with schedulers works correctly', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'files/testCommands.js')
      }
    ],
    schedulers: {
      scheduler: {
        adapter: {
          module: 'resolve-scheduler-local',
          options: {}
        },
        connectorName: 'default'
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
