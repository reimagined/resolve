import path from 'path'

import alias from '../../src/core/alias/$resolve.aggregates'

describe('base config works correctly', () => {
  const resolveConfig = {
    aggregates: [
      {
        name: 'Todo',
        commands: path.resolve(__dirname, 'testCommands.js')
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
