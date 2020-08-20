import { Command } from 'resolve-core'
import { mocked } from 'ts-jest/utils'
import { useDispatch } from 'react-redux'
import { renderHook, act } from '@testing-library/react-hooks'
import { CommandBuilder, useCommand } from 'resolve-react-hooks'
import { sendCommandRequest } from '../../src/command/actions'
import {
  useReduxCommand,
  CommandReduxHookOptions
} from '../../src/command/use-redux-command'
import { CommandCallback } from 'resolve-client'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn()
}))
jest.mock('resolve-react-hooks', () => ({
  useCommand: jest.fn()
}))

const mUseDispatch = mocked(useDispatch)
const mUseCommand = mocked(useCommand)
const mDispatch = jest.fn()
const mUseCommandHookExecutor = jest.fn()

beforeAll(() => {
  mUseDispatch.mockReturnValue(mDispatch)
  mUseCommand.mockReturnValue(mUseCommandHookExecutor)
})

afterEach(() => {
  mDispatch.mockClear()
  mUseCommand.mockClear()
  mUseCommandHookExecutor.mockClear()
})

const extractUseCommandCallback = (): CommandCallback =>
  mUseCommand.mock.calls[0][2]

describe('command as plain object overload', () => {
  const makeCommand = (): Command => ({
    type: 'type',
    aggregateId: 'aggregate-id',
    aggregateName: 'aggregate-name',
    payload: {
      a: 'a'
    }
  })

  const renderCommandHook = (
    command: Command,
    options?: CommandReduxHookOptions
  ) => {
    const {
      result: {
        current: { execute }
      }
    } = renderHook(() =>
      options ? useReduxCommand(command, options) : useReduxCommand(command)
    )
    return execute
  }

  test('command request action dispatched', () => {
    const execute = renderCommandHook(makeCommand())

    act(() => execute())

    expect(mDispatch).toHaveBeenCalledWith(
      sendCommandRequest(
        {
          type: 'type',
          aggregateId: 'aggregate-id',
          aggregateName: 'aggregate-name',
          payload: { a: 'a' }
        },
        true
      )
    )
  })

  test('useCommand base hook called with generic command builder', () => {
    const command = makeCommand()
    const execute = renderCommandHook(command)

    act(() => execute())

    expect(mUseCommand).toHaveBeenCalledTimes(1)
    expect(mUseCommand).toHaveBeenCalledWith(
      expect.any(Function),
      {},
      expect.any(Function),
      expect.any(Array)
    )

    const genericBuilder = mUseCommand.mock.calls[0][0]
    expect(genericBuilder(command)).toEqual(command)
  })

  test('custom command options are passed to base hook', () => {
    renderCommandHook(makeCommand(), {
      commandOptions: {
        option: 'a'
      }
    })

    expect(mUseCommand).toHaveBeenCalledWith(
      expect.anything(),
      { option: 'a' },
      expect.anything(),
      expect.anything()
    )
  })

  test('custom redux actions', async () => {
    const command = makeCommand()
    const execute = renderCommandHook(command, {
      actions: {
        request: command => ({ type: 'request', command }),
        success: (command, result) => ({ type: 'success', command, result }),
        failure: (command, error) => ({ type: 'failure', command, error })
      }
    })

    act(() => execute())

    expect(mDispatch).toHaveBeenCalledWith({ type: 'request', command })

    const callback = extractUseCommandCallback()

    mDispatch.mockClear()
    await callback(null, { a: 'a' }, command)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'success',
      command,
      result: { a: 'a' }
    })

    mDispatch.mockClear()
    await callback(Error('error'), null, command)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'failure',
      command,
      error: Error('error')
    })
  })
})

describe('command as builder function overload', () => {
  const builder = (data: { a: string }) => ({
    type: 'type',
    aggregateId: 'aggregate-id',
    aggregateName: 'aggregate-name',
    payload: data
  })

  function renderCommandHook<T>(
    builder: CommandBuilder<T>,
    options?: CommandReduxHookOptions
  ) {
    const {
      result: {
        current: { execute }
      }
    } = renderHook(() =>
      options ? useReduxCommand(builder, options) : useReduxCommand(builder)
    )
    return execute
  }

  test('command request action dispatched', () => {
    const execute = renderCommandHook(builder)

    act(() => execute({ a: 'a' }))

    expect(mDispatch).toHaveBeenCalledWith(
      sendCommandRequest(
        {
          type: 'type',
          aggregateId: 'aggregate-id',
          aggregateName: 'aggregate-name',
          payload: { a: 'a' }
        },
        true
      )
    )
  })

  test('useCommand base hook called with default options', () => {
    const command = builder({ a: 'a' })
    const execute = renderCommandHook(builder)

    act(() => execute({ a: 'a' }))

    expect(mUseCommand).toHaveBeenCalledTimes(1)
    expect(mUseCommand).toHaveBeenCalledWith(
      expect.any(Function),
      {},
      expect.any(Function),
      expect.any(Array)
    )

    const genericBuilder = mUseCommand.mock.calls[0][0]
    expect(genericBuilder(command)).toEqual(command)
  })

  test('custom command options are passed to base hook', () => {
    renderCommandHook(builder, {
      commandOptions: {
        option: 'a'
      }
    })

    expect(mUseCommand).toHaveBeenCalledWith(
      expect.anything(),
      { option: 'a' },
      expect.anything(),
      expect.anything()
    )
  })

  test('custom redux actions', async () => {
    const execute = renderCommandHook(builder, {
      actions: {
        request: command => ({ type: 'request', command }),
        success: (command, result) => ({ type: 'success', command, result }),
        failure: (command, error) => ({ type: 'failure', command, error })
      }
    })

    const command = builder({ a: 'a' })

    act(() => execute({ a: 'a' }))

    expect(mDispatch).toHaveBeenCalledWith({ type: 'request', command })

    const callback = extractUseCommandCallback()

    mDispatch.mockClear()
    await callback(null, { a: 'a' }, command)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'success',
      command,
      result: { a: 'a' }
    })

    mDispatch.mockClear()
    await callback(Error('error'), null, command)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'failure',
      command,
      error: Error('error')
    })
  })
})
