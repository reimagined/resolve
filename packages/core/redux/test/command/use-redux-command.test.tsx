import { Command } from '@resolve-js/core'
import { mocked } from 'jest-mock'
import { useDispatch } from 'react-redux'
import { renderHook, act } from '@testing-library/react-hooks'
import { useCommandBuilder } from '@resolve-js/react-hooks'
import { sendCommandRequest } from '../../src/command/actions'
import {
  CommandReduxHookOptions,
  useReduxCommand,
} from '../../src/command/use-redux-command'
import { CommandCallback } from '@resolve-js/client'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}))
jest.mock('@resolve-js/react-hooks', () => ({
  useCommandBuilder: jest.fn(),
}))

const mUseDispatch = mocked(useDispatch)
const mUseCommandBuilder = mocked(useCommandBuilder)
const mDispatch = jest.fn()
const mUseCommandHookExecutor = jest.fn()

beforeAll(() => {
  mUseDispatch.mockReturnValue(mDispatch)
  mUseCommandBuilder.mockReturnValue(mUseCommandHookExecutor)
})

afterEach(() => {
  mDispatch.mockClear()
  mUseCommandBuilder.mockClear()
  mUseCommandHookExecutor.mockClear()
})

const extractUseCommandCallback = (): CommandCallback<Command> =>
  mUseCommandBuilder.mock.calls[0][2]

describe('command as plain object overload', () => {
  const makeCommand = (): Command => ({
    type: 'type',
    aggregateId: 'aggregate-id',
    aggregateName: 'aggregate-name',
    payload: {
      a: 'a',
    },
  })
  const makeOptions = (): CommandReduxHookOptions<Command> => ({
    commandOptions: {
      middleware: {},
    },
  })

  test('command request action dispatched', () => {
    const {
      result: {
        current: { execute },
      },
    } = renderHook(() => useReduxCommand(makeCommand()))

    act(() => execute())

    expect(mDispatch).toHaveBeenCalledWith(
      sendCommandRequest(
        {
          type: 'type',
          aggregateId: 'aggregate-id',
          aggregateName: 'aggregate-name',
          payload: { a: 'a' },
        },
        true
      )
    )
  })

  test('useCommandBuilder base hook called with generic command builder', () => {
    const command = makeCommand()
    renderHook(() => useReduxCommand(command))

    expect(mUseCommandBuilder).toHaveBeenCalledTimes(1)
    expect(mUseCommandBuilder).toHaveBeenCalledWith(
      expect.any(Function),
      {},
      expect.any(Function)
    )

    const genericBuilder = mUseCommandBuilder.mock.calls[0][0]
    expect(genericBuilder(command)).toEqual(command)
  })

  test('useCommandBuilder base hook called with custom dependencies', () => {
    const dependency = 'dependency'

    renderHook(() => useReduxCommand(makeCommand(), [dependency]))

    expect(mUseCommandBuilder).toHaveBeenCalledTimes(1)
    expect(mUseCommandBuilder).toHaveBeenCalledWith(
      expect.any(Function),
      {},
      expect.any(Function),
      [dependency]
    )
  })

  test('custom command options are passed to base hook', () => {
    renderHook(() => useReduxCommand(makeCommand(), makeOptions()))

    expect(mUseCommandBuilder).toHaveBeenCalledWith(
      expect.anything(),
      makeOptions().commandOptions,
      expect.anything()
    )
  })

  test('custom command options with dependencies', () => {
    const dependency = 'dependency'
    renderHook(() =>
      useReduxCommand(makeCommand(), makeOptions(), [dependency])
    )

    expect(mUseCommandBuilder).toHaveBeenCalledWith(
      expect.anything(),
      makeOptions().commandOptions,
      expect.anything(),
      [dependency]
    )
  })

  test('custom redux actions', async () => {
    const command = makeCommand()
    const {
      result: {
        current: { execute },
      },
    } = renderHook(() =>
      useReduxCommand(command, {
        actions: {
          request: (command) => ({ type: 'request', command }),
          success: (command, result) => ({ type: 'success', command, result }),
          failure: (command, error) => ({ type: 'failure', command, error }),
        },
      })
    )

    act(() => execute())

    expect(mDispatch).toHaveBeenCalledWith({ type: 'request', command })

    const callback = extractUseCommandCallback()

    mDispatch.mockClear()
    await callback(null, { a: 'a' }, command)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'success',
      command,
      result: { a: 'a' },
    })

    mDispatch.mockClear()
    await callback(Error('error'), null, command)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'failure',
      command,
      error: Error('error'),
    })
  })

  test('cached hook data if underlying executor not changed', () => {
    const hook = renderHook(() => useReduxCommand(makeCommand()))

    const data = hook.result.current

    hook.rerender()
    expect(hook.result.current).toBe(data)
  })

  test('new hook if underlying executor has been changed', () => {
    const hook = renderHook(() => useReduxCommand(makeCommand()))

    const data = hook.result.current

    mUseCommandBuilder.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('new hook if redux dispatch has been changed', () => {
    const hook = renderHook(() => useReduxCommand(makeCommand()))

    const data = hook.result.current

    mUseDispatch.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('cached hook data if underlying executor not changed (with options)', () => {
    const hook = renderHook(() => useReduxCommand(makeCommand(), makeOptions()))

    const data = hook.result.current

    hook.rerender()
    expect(hook.result.current).toBe(data)
  })

  test('new hook if underlying executor has been changed (with options)', () => {
    const hook = renderHook(() => useReduxCommand(makeCommand(), makeOptions()))

    const data = hook.result.current

    mUseCommandBuilder.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('new hook if redux dispatch has been changed (with options)', () => {
    const hook = renderHook(() => useReduxCommand(makeCommand(), makeOptions()))

    const data = hook.result.current

    mUseDispatch.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })
})

describe('command as builder function overload', () => {
  const builder = (data: { a: string }) => ({
    type: 'type',
    aggregateId: 'aggregate-id',
    aggregateName: 'aggregate-name',
    payload: data,
  })
  const makeOptions = (): CommandReduxHookOptions<Command> => ({
    commandOptions: {
      middleware: {},
    },
  })

  test('command request action dispatched', () => {
    const {
      result: {
        current: { execute },
      },
    } = renderHook(() => useReduxCommand(builder))

    act(() => execute({ a: 'a' }))

    expect(mDispatch).toHaveBeenCalledWith(
      sendCommandRequest(
        {
          type: 'type',
          aggregateId: 'aggregate-id',
          aggregateName: 'aggregate-name',
          payload: { a: 'a' },
        },
        true
      )
    )
  })

  test('useCommandBuilder base hook called with generic command builder', () => {
    renderHook(() => useReduxCommand(builder))

    expect(mUseCommandBuilder).toHaveBeenCalledTimes(1)
    expect(mUseCommandBuilder).toHaveBeenCalledWith(
      expect.any(Function),
      {},
      expect.any(Function)
    )

    const genericBuilder = mUseCommandBuilder.mock.calls[0][0]
    expect(genericBuilder({ a: 'a' })).toEqual({ a: 'a' })
  })

  test('useCommandBuilder base hook called with custom dependencies', () => {
    const dependency = 'dependency'

    renderHook(() => useReduxCommand(builder, [dependency]))

    expect(mUseCommandBuilder).toHaveBeenCalledTimes(1)
    expect(mUseCommandBuilder).toHaveBeenCalledWith(
      expect.any(Function),
      {},
      expect.any(Function),
      [dependency]
    )
  })

  test('custom command options are passed to base hook', () => {
    renderHook(() => useReduxCommand(builder, makeOptions()))

    expect(mUseCommandBuilder).toHaveBeenCalledWith(
      expect.anything(),
      makeOptions().commandOptions,
      expect.anything()
    )
  })

  test('custom command options with dependencies', () => {
    const dependency = 'dependency'
    renderHook(() => useReduxCommand(builder, makeOptions(), [dependency]))

    expect(mUseCommandBuilder).toHaveBeenCalledWith(
      expect.anything(),
      makeOptions().commandOptions,
      expect.anything(),
      [dependency]
    )
  })

  test('custom redux actions', async () => {
    const {
      result: {
        current: { execute },
      },
    } = renderHook(() =>
      useReduxCommand(builder, {
        actions: {
          request: (command) => ({ type: 'request', command }),
          success: (command, result) => ({ type: 'success', command, result }),
          failure: (command, error) => ({ type: 'failure', command, error }),
        },
      })
    )

    const command = builder({ a: 'a' })

    act(() => execute({ a: 'a' }))

    expect(mDispatch).toHaveBeenCalledWith({ type: 'request', command })

    const callback = extractUseCommandCallback()

    mDispatch.mockClear()
    await callback(null, { a: 'a' }, command)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'success',
      command,
      result: { a: 'a' },
    })

    mDispatch.mockClear()
    await callback(Error('error'), null, command)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'failure',
      command,
      error: Error('error'),
    })
  })

  test('cached hook data if underlying executor not changed', () => {
    const dependency = 'dependency'
    const hook = renderHook(() => useReduxCommand(builder, [dependency]))

    const data = hook.result.current

    hook.rerender()
    expect(hook.result.current).toBe(data)
  })

  test('new hook if underlying executor has been changed', () => {
    const hook = renderHook(() => useReduxCommand(builder))

    const data = hook.result.current

    mUseCommandBuilder.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('new hook if redux dispatch has been changed', () => {
    const hook = renderHook(() => useReduxCommand(builder))

    const data = hook.result.current

    mUseDispatch.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('cached hook data if underlying executor not changed (with options)', () => {
    const dependency = 'dependency'
    const hook = renderHook(() =>
      useReduxCommand(builder, makeOptions(), [dependency])
    )

    const data = hook.result.current

    hook.rerender()
    expect(hook.result.current).toBe(data)
  })

  test('new hook if underlying executor has been changed (with options)', () => {
    const hook = renderHook(() => useReduxCommand(builder, makeOptions()))

    const data = hook.result.current

    mUseCommandBuilder.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('new hook if redux dispatch has been changed (with options)', () => {
    const hook = renderHook(() => useReduxCommand(builder, makeOptions()))

    const data = hook.result.current

    mUseDispatch.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })
})
