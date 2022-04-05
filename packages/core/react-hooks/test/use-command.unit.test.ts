import { renderHook } from '@testing-library/react-hooks'
import { mocked } from 'jest-mock'
import { Command, CommandCallback, CommandOptions } from '@resolve-js/client'
import { useClient } from '../src/use-client'
import { useCommand } from '../src/use-command'

jest.mock('@resolve-js/client')
jest.mock('../src/use-client', () => ({
  useClient: jest.fn(),
}))

const mockedUseClient = mocked(useClient)

const mockedClient = {
  command: jest.fn(() => Promise.resolve({ result: 'command-result' })),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn(),
  getOriginPath: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
}
const basicCommand = (): Command => ({
  type: 'create',
  aggregateName: 'user',
  aggregateId: 'new',
  payload: {
    name: 'username',
  },
})
const basicOptions = (): CommandOptions => ({
  middleware: {},
})

const buildCommand = jest.fn(
  (name: string): Command => ({
    type: 'create',
    aggregateName: 'user',
    aggregateId: 'new',
    payload: {
      name,
    },
  })
)

const clearMocks = (): void => {
  mockedUseClient.mockClear()
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
    renderHook(() => useCommand(basicCommand()))

    expect(mockedUseClient).toHaveBeenCalled()
  })
})

describe('async mode', () => {
  test('just a command', async () => {
    const command = basicCommand()

    const {
      result: { current: execute },
    } = renderHook(() => useCommand(command))

    await execute()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      undefined
    )
  })

  test('cached command executor with custom dependencies', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(command, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor on underlying client change', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(command, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    mockedUseClient.mockReturnValueOnce({
      ...mockedClient,
    })
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('new command executor on dependencies change', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(command, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('command and options', async () => {
    const command = basicCommand()
    const options = { middleware: {} }

    const {
      result: { current: execute },
    } = renderHook(() => useCommand(command, options))

    await execute()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      options,
      undefined
    )
  })

  test('cached command executor with custom dependencies (with options)', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(command, basicOptions(), props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor on dependencies change (with options)', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(command, basicOptions(), props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })
})

describe('callback mode', () => {
  let callback: CommandCallback<Command>

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a command', () => {
    const command = basicCommand()

    const {
      result: { current: execute },
    } = renderHook(() => useCommand(command, callback))

    execute()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      callback
    )
  })

  test('cached command executor with custom dependencies', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(command, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor on underlying client change', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(command, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    mockedUseClient.mockReturnValueOnce({
      ...mockedClient,
    })
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('new command executor on dependencies change', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(command, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('command, options and callback', () => {
    const command = basicCommand()
    const options = basicOptions()

    const {
      result: { current: execute },
    } = renderHook(() => useCommand(command, options, callback))

    execute()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      options,
      callback
    )
  })

  test('cached command executor with custom dependencies (with options)', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) =>
        useCommand(command, basicOptions(), callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor on dependencies change (with options)', async () => {
    const command = basicCommand()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) =>
        useCommand(command, basicOptions(), callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })
})

describe('builder: async mode', () => {
  test('just a builder', async () => {
    const {
      result: { current: execute },
    } = renderHook(() => useCommand(buildCommand))

    await execute('builder-input')

    expect(buildCommand).toHaveBeenCalledWith('builder-input')
    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      undefined,
      undefined
    )
  })

  test('new command executor on re-render without dependencies', async () => {
    const hookData = renderHook(() => useCommand(buildCommand))
    const executeA = hookData.result.current

    hookData.rerender()
    expect(hookData.result.current).not.toBe(executeA)
  })

  test('cached command executor with custom dependencies', async () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(buildCommand, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor with custom dependencies but changed underlying client', async () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(buildCommand, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    mockedUseClient.mockReturnValueOnce({
      ...mockedClient,
    })
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('builder and options', async () => {
    const options = basicOptions()

    const {
      result: { current: execute },
    } = renderHook(() => useCommand(buildCommand, options))

    await execute('builder-input')

    expect(buildCommand).toHaveBeenCalledWith('builder-input')
    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      options,
      undefined
    )
  })

  test('cached command executor with custom dependencies (with options)', async () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(buildCommand, basicOptions(), props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor on dependencies change (with options)', async () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(buildCommand, basicOptions(), props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })
})

describe('builder: callback mode', () => {
  let callback: CommandCallback<Command>

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a builder', () => {
    const {
      result: { current: execute },
    } = renderHook(() => useCommand(buildCommand, callback))

    execute('builder-input')

    expect(buildCommand).toHaveBeenCalledWith('builder-input')
    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      undefined,
      callback
    )
  })

  test('new command executor on re-render without dependencies', () => {
    const hookData = renderHook(() => useCommand(buildCommand, callback))
    const executeA = hookData.result.current

    hookData.rerender()
    expect(hookData.result.current).not.toBe(executeA)
  })

  test('cached command executor with custom dependencies', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(buildCommand, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor with custom dependencies but changed underlying client', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useCommand(buildCommand, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    mockedUseClient.mockReturnValueOnce({
      ...mockedClient,
    })
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('builder and options', () => {
    const options = basicOptions()

    const {
      result: { current: execute },
    } = renderHook(() => useCommand(buildCommand, options, callback))

    execute('builder-input')

    expect(buildCommand).toHaveBeenCalledWith('builder-input')
    expect(mockedClient.command).toHaveBeenCalledWith(
      buildCommand('builder-input'),
      options,
      callback
    )
  })

  test('cached command executor with custom dependencies (with options)', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) =>
        useCommand(buildCommand, basicOptions(), callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor on dependencies change (with options)', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) =>
        useCommand(buildCommand, basicOptions(), callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })
})
