import type { Runtime } from '@resolve-js/runtime-base'
import { mocked } from 'ts-jest/utils'

import { schedulerFactory } from '../src/scheduler-factory'
import { start } from '../src/scheduler-start'
import { stopAll } from '../src/scheduler-stop-all'

jest.mock('../src/scheduler-start.ts', () => ({
  start: jest.fn(),
}))

jest.mock('../src/scheduler-stop-all.ts', () => ({
  stopAll: jest.fn(),
}))

describe('scheduler.addEntries', () => {
  test('should work correctly', async () => {
    const executeSchedulerCommand = (async ({ aggregateId, type, payload }) => {
      return {
        type,
        aggregateId,
        payload,
        timestamp: Date.now(),
        aggregateVersion: 1,
      }
    }) as Runtime['executeSchedulerCommand']

    const scheduler = schedulerFactory(
      {
        executeSchedulerCommand,
      } as Runtime,
      'schedulerName'
    )

    mocked(start).mockResolvedValueOnce()
    mocked(start).mockResolvedValueOnce()
    mocked(start).mockResolvedValueOnce()

    await expect(
      scheduler.addEntries([
        {
          taskId: 'id1',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
        {
          taskId: 'id2',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
        {
          taskId: 'id3',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
      ])
    ).resolves.toEqual(undefined)

    expect(start).toBeCalledTimes(3)
  })
  test('should throw a concatenated error', async () => {
    const executeSchedulerCommand = (async ({ aggregateId, type, payload }) => {
      return {
        type,
        aggregateId,
        payload,
        timestamp: Date.now(),
        aggregateVersion: 1,
      }
    }) as Runtime['executeSchedulerCommand']

    const scheduler = schedulerFactory(
      {
        executeSchedulerCommand,
      } as Runtime,
      'schedulerName'
    )

    mocked(start).mockResolvedValueOnce()
    mocked(start).mockRejectedValueOnce(new Error('First'))
    mocked(start).mockRejectedValueOnce(new Error('Second'))

    await expect(
      scheduler.addEntries([
        {
          taskId: 'id1',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
        {
          taskId: 'id2',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
        {
          taskId: 'id3',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
      ])
    ).rejects.toThrow()
  })
})

describe('scheduler.executeEntries', () => {
  test('should work correctly', async () => {
    const executeSchedulerCommand = jest.fn((async ({
      aggregateId,
      type,
      payload,
    }) => {
      return {
        type,
        aggregateId,
        payload,
        timestamp: Date.now(),
        aggregateVersion: 1,
      }
    }) as Runtime['executeSchedulerCommand'])

    const scheduler = schedulerFactory(
      {
        executeSchedulerCommand: executeSchedulerCommand as any,
      } as Runtime,
      'schedulerName'
    )

    await expect(
      scheduler.executeEntries([
        {
          taskId: 'id1',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
        {
          taskId: 'id2',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
        {
          taskId: 'id3',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
      ])
    ).resolves.toEqual(undefined)

    expect(start).toBeCalledTimes(3)
  })
  /* test('should throw a concatenated error', async () => {
    const executeSchedulerCommand = (async ({ aggregateId, type, payload }) => {
      return {
        type,
        aggregateId,
        payload,
        timestamp: Date.now(),
        aggregateVersion: 1,
      }
    }) as Runtime['executeSchedulerCommand']

    const scheduler = schedulerFactory(
      {
        executeSchedulerCommand,
      } as Runtime,
      'schedulerName'
    )

    mocked(start).mockResolvedValueOnce()
    mocked(start).mockRejectedValueOnce(new Error('First'))
    mocked(start).mockRejectedValueOnce(new Error('Second'))

    await expect(
      scheduler.addEntries([
        {
          taskId: 'id1',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
        {
          taskId: 'id2',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
        {
          taskId: 'id3',
          command: {
            type: 'test',
          },
          date: Date.now(),
        },
      ])
    ).rejects.toThrow()
  })*/
})
