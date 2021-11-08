import { mock, mockDeep } from 'jest-mock-extended'
import { createRuntime } from '@resolve-js/runtime-base'
import { mocked } from 'ts-jest/utils'
import { startExpress } from '../src/start-express'
import { expressAppFactory } from '../src/express-app-factory'
import { websocketServerFactory } from '../src/websocket-server-factory'

import factory from '../src/index'
import type { RuntimeOptions } from '../src/index'
import type { DomainMeta } from '@resolve-js/core'
import type { RuntimeEntryContext } from '@resolve-js/runtime-base'

jest.mock('../src/prepare-domain', () => ({
  prepareDomain: jest.fn(() => mockDeep<DomainMeta>()),
}))
jest.mock('../src/performance-tracer-factory', () => ({
  performanceTracerFactory: jest.fn(),
}))
jest.mock('../src/event-subscriber-notifier-factory', () => ({
  eventSubscriberNotifierFactory: jest.fn(),
}))
jest.mock('../src/express-app-factory', () => ({
  expressAppFactory: jest.fn(() =>
    mockDeep<ReturnType<typeof expressAppFactory>>()
  ),
}))
jest.mock('../src/websocket-server-factory', () => ({
  websocketServerFactory: jest.fn(() =>
    mockDeep<ReturnType<typeof websocketServerFactory>>()
  ),
}))
jest.mock('../src/start-express', () => ({
  startExpress: jest.fn(),
}))
jest.mock('../src/clean-up-process', () => ({
  cleanUpProcess: jest.fn(),
}))
jest.mock('../src/uploader-factory', () => ({
  uploaderFactory: jest.fn(),
}))
jest.mock('../src/scheduler-factory', () => ({
  schedulerFactory: jest.fn(),
}))

const mStartExpress = mocked(startExpress)
const mCreateRuntime = mocked(createRuntime)

const getFactoryParameters = () => mStartExpress.mock.calls[0][2]
const execAsyncBuild = async () => {
  await getFactoryParameters().invokeBuildAsync({
    eventSubscriber: 'test',
    initiator: 'read-model-next',
    sendTime: Date.now(),
    notificationId: 'test-id',
  })
}
const startRuntime = async (options: RuntimeOptions) => {
  const runtime = await factory(options)
  const worker = await runtime.entry(mock<RuntimeEntryContext>())
  await worker()
  expect(mStartExpress).toHaveBeenCalled()
}

afterEach(() => {
  jest.clearAllMocks()
})

test('same getVacantTime for index and async builds job', async () => {
  await startRuntime({})
  const primaryGetVacantTime = getFactoryParameters().getVacantTimeInMillis

  mCreateRuntime.mockClear()
  await execAsyncBuild()
  expect(mCreateRuntime).toHaveBeenCalled()

  const builderGetVacantTime =
    mCreateRuntime.mock.calls[0][0].getVacantTimeInMillis

  expect(primaryGetVacantTime).toEqual(builderGetVacantTime)
})

test('getVacantTime emulates infinity by default', async () => {
  await startRuntime({})
  const getVacantTime = getFactoryParameters().getVacantTimeInMillis

  const start = Date.now()
  const timeA = getVacantTime(() => start)
  await new Promise((resolve) => setTimeout(resolve, 10))
  const timeB = getVacantTime(() => start)

  expect(timeA).toEqual(timeB)
})

test('getVacantTime emulates limited worker lifetime with option', async () => {
  await startRuntime({
    emulateWorkerLifetimeLimit: 10,
  })
  const getVacantTime = getFactoryParameters().getVacantTimeInMillis

  const start = Date.now()
  await new Promise((resolve) => setTimeout(resolve, 15))
  const vacantTime = getVacantTime(() => start)

  expect(vacantTime).toBeLessThan(0)
})
