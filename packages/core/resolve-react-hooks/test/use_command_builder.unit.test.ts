import { useCallback } from 'react'
import { mocked } from 'ts-jest/utils'
import { Command, CommandCallback } from 'resolve-client'
import { useClient } from '../src/use_client'
import { useCommandBuilder } from '../src/use_command_builder'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useCallback: jest.fn(cb => cb)
}))
jest.mock('../src/use_client', () => ({
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
    useCommandBuilder(buildCommand)

    expect(mockedUseClient).toHaveBeenCalled()
  })
})

describe('async mode', () => {
  test('just a command', async () => {
    await useCommandBuilder(buildCommand)('data')
    //expect(buildCommand).toHaveBeenCalledWith

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand(),
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildCommand
    ])
  })

  test('command and dependencies', async () => {
    await useCommandBuilder(buildCommand, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand(),
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('command and options', async () => {
    const options = { option: 'option' }

    await useCommandBuilder(buildCommand, options)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand(),
      options,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildCommand,
      options
    ])
  })

  test('command, options and dependencies', async () => {
    await useCommandBuilder(buildCommand, { option: 'option' }, [
      'dependency'
    ])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand(),
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
    useCommandBuilder(buildCommand, callback)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand(),
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildCommand,
      callback
    ])
  })

  test('command, callback and dependencies', () => {
    useCommandBuilder(buildCommand, callback, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand(),
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('command, options and callback', () => {
    const options = { option: 'option' }

    useCommandBuilder(buildCommand, options, callback)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand(),
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

  test('command, options, callback and dependencies', () => {
    useCommandBuilder(buildCommand, { option: 'option' }, callback, [
      'dependency'
    ])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand(),
      { option: 'option' },
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })
})
