import { useCallback } from 'react'
import { mocked } from 'ts-jest/utils'
import { Command, CommandCallback } from 'resolve-client'
import { useClient } from '../src/use_client'
import { useCommandBuilder } from '../src/use-command-builder'

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
  test('just a builder', async () => {
    await useCommandBuilder(buildCommand)('builder-input')
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
    await useCommandBuilder(buildCommand, ['dependency'])('builder-input')
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

    await useCommandBuilder(buildCommand, options)('builder-input')
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
    await useCommandBuilder(buildCommand, { option: 'option' }, ['dependency'])(
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

describe('callback mode', () => {
  let callback: CommandCallback

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a builder', () => {
    useCommandBuilder(buildCommand, callback)('builder-input')
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
    useCommandBuilder(buildCommand, callback, ['dependency'])('builder-input')
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

    useCommandBuilder(buildCommand, options, callback)('builder-input')
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
    useCommandBuilder(buildCommand, { option: 'option' }, callback, [
      'dependency'
    ])('builder-input')
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
