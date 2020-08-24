import { useCallback } from 'react'
import { mocked } from 'ts-jest/utils'
import { Command, CommandCallback } from 'resolve-client'
import { useClient } from '../src/use-client'
import { useCommand } from '../src/use-command'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useCallback: jest.fn(cb => cb)
}))
jest.mock('../src/use-client', () => ({
  useClient: jest.fn()
}))

const mockedUseClient = mocked(useClient)
const mockedUseCallback = mocked(useCallback)

const mockedClient = {
  command: jest.fn(() => Promise.resolve({ result: 'command-result' })),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
}
const basicCommand = (): Command => ({
  type: 'create',
  aggregateName: 'user',
  aggregateId: 'new',
  payload: {
    name: 'username'
  }
})

const buildCommand = jest.fn(
  (name: string): Command => ({
    type: 'create',
    aggregateName: 'user',
    aggregateId: 'new',
    payload: {
      name
    }
  })
)

const clearMocks = (): void => {
  mockedUseClient.mockClear()
  mockedUseCallback.mockClear()
  mockedClient.command.mockClear()
  buildCommand.mockClear()
}

beforeAll(() => {
  mockedUseClient.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

describe('common', () => {
  test('useClient hook called', () => {
    useCommand(basicCommand())

    expect(mockedUseClient).toHaveBeenCalled()
  })
})

describe('async mode', () => {
  test('just a command', async () => {
    const command = basicCommand()

    await useCommand(command)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      command
    ])
  })

  test('command and dependencies', async () => {
    const command = basicCommand()

    await useCommand(command, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('command and options', async () => {
    const command = basicCommand()
    const options = { option: 'option' }

    await useCommand(command, options)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      options,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      command,
      options
    ])
  })

  test('command, options and dependencies', async () => {
    const command = basicCommand()

    await useCommand(command, { option: 'option' }, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      { option: 'option' },
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })
})

describe('callback mode', () => {
  let callback: CommandCallback

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a command', () => {
    const command = basicCommand()

    useCommand(command, callback)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      command,
      callback
    ])
  })

  test('command, callback and dependencies', () => {
    const command = basicCommand()

    useCommand(command, callback, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('command, options and callback', () => {
    const command = basicCommand()
    const options = { option: 'option' }

    useCommand(command, options, callback)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      { option: 'option' },
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      command,
      options,
      callback
    ])
  })

  test('command, options, callback and dependencies', () => {
    const command = basicCommand()

    useCommand(command, { option: 'option' }, callback, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      { option: 'option' },
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })
})

describe('builder: async mode', () => {
  test('just a builder', async () => {
    await useCommand(buildCommand)('builder-input')
    expect(buildCommand).toHaveBeenCalledWith('builder-input')

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildCommand
    ])
  })

  test('builder and dependencies', async () => {
    await useCommand(buildCommand, ['dependency'])('builder-input')
    expect(buildCommand).toHaveBeenCalledWith('builder-input')

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('builder and options', async () => {
    const options = { option: 'option' }

    await useCommand(buildCommand, options)('builder-input')
    expect(buildCommand).toHaveBeenCalledWith('builder-input')

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      options,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildCommand,
      options
    ])
  })

  test('builder, options and dependencies', async () => {
    await useCommand(buildCommand, { option: 'option' }, ['dependency'])(
      'builder-input'
    )
    expect(buildCommand).toHaveBeenCalledWith('builder-input')

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      { option: 'option' },
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })
})

describe('builder: callback mode', () => {
  let callback: CommandCallback

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a builder', () => {
    useCommand(buildCommand, callback)('builder-input')
    expect(buildCommand).toHaveBeenCalledWith('builder-input')

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildCommand,
      callback
    ])
  })

  test('builder, callback and dependencies', () => {
    useCommand(buildCommand, callback, ['dependency'])('builder-input')
    expect(buildCommand).toHaveBeenCalledWith('builder-input')

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('builder, options and callback', () => {
    const options = { option: 'option' }

    useCommand(buildCommand, options, callback)('builder-input')
    expect(buildCommand).toHaveBeenCalledWith('builder-input')

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      { option: 'option' },
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildCommand,
      options,
      callback
    ])
  })

  test('builder, options, callback and dependencies', () => {
    useCommand(buildCommand, { option: 'option' }, callback, ['dependency'])(
      'builder-input'
    )
    expect(buildCommand).toHaveBeenCalledWith('builder-input')

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      { option: 'option' },
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })
})
