import { renderHook } from '@testing-library/react-hooks'
import { mocked } from 'jest-mock'
import { useCommand } from '../src/use-command'
import { useCommandBuilder } from '../src/use-command-builder'
import { CommandCallback, CommandOptions } from '@resolve-js/client'

jest.mock('@resolve-js/client')
jest.mock('../src/use-command', () => ({
  useCommand: jest.fn(() => jest.fn()),
}))

const mockedUseCommand = mocked(useCommand)

const mockedClient = {
  command: jest.fn(() => Promise.resolve({ result: 'command-result' })),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
}

const clearMocks = (): void => {
  mockedUseCommand.mockClear()
  mockedClient.command.mockClear()
}

afterEach(() => {
  clearMocks()
})

describe('common', () => {
  test('useCommand hook called', () => {
    const commandBuilder = jest.fn()
    const commandOptions: CommandOptions = {}
    const commandCallback: CommandCallback<any> = jest.fn()
    const dependencies: any[] = []

    renderHook(() =>
      useCommandBuilder(
        commandBuilder,
        commandOptions,
        commandCallback,
        dependencies
      )
    )

    expect(mockedUseCommand).toHaveBeenCalledWith(
      commandBuilder,
      commandOptions,
      commandCallback,
      dependencies
    )
  })

  test('variadic builder generic arguments (compile time)', () => {
    const executor = useCommandBuilder(
      (userId: string, commandName: string) => ({
        aggregateId: userId,
        aggregateName: 'user',
        type: commandName,
      })
    )

    executor('user-id', 'command-name')
  })
})
