import path from 'path'

import alias from '../../src/core/alias/$resolve.aggregates'

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
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'files/testCommands.js'),
        snapshot: {
          adapter: path.resolve(__dirname, 'files/testSnapshotAdapter.js'),
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

/*
"name": {
  "type": "string"
},
"commands": {
  "type": "string",
  "constraints": {
    "file": true
  }
},
"projection": {
  "type": "string",
  "constraints": {
    "file": true
  }
},
"snapshot": {
  "$ref": "#/definitions/adapter"
}
 */
