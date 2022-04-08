import columnify from 'columnify'
import { mocked } from 'jest-mock'

import createMonitoring from '../src'

const mockGetMetrics = jest.fn()
const mockClearMetrics = jest.fn()
const mockGroup = jest.fn()
const mockError = jest.fn()
const mockExecution = jest.fn()
const mockDuration = jest.fn()
const mockTime = jest.fn()
const mockTimeEnd = jest.fn()
const mockRate = jest.fn()
const mockCustom = jest.fn()

jest.mock('@resolve-js/monitoring-base', () => () => ({
  getMetrics: mockGetMetrics,
  clearMetrics: mockClearMetrics,
  group: mockGroup.mockReturnThis(),
  error: mockError,
  execution: mockExecution,
  duration: mockDuration,
  time: mockTime,
  timeEnd: mockTimeEnd,
  rate: mockRate,
  custom: mockCustom,
}))

jest.mock('columnify', () => jest.fn())

let originalNow: typeof Date.now
let dateSpy: jest.SpyInstance | null
let originalLog: typeof console.log
let mockLog: jest.Mock

beforeEach(() => {
  originalNow = Date.now
  Date.now = jest.fn().mockReturnValue(1234)
  // eslint-disable-next-line no-console
  originalLog = console.log
  mockLog = jest.fn()
  // eslint-disable-next-line no-console
  console.log = mockLog
})

afterEach(() => {
  mockLog.mockClear()
  // eslint-disable-next-line no-console
  console.log = originalLog
  Date.now = originalNow

  if (dateSpy != null) {
    dateSpy.mockRestore()
    dateSpy = null
  }

  mockGetMetrics.mockClear()
  mockClearMetrics.mockClear()
  mockGroup.mockClear()
  mockError.mockClear()
  mockExecution.mockClear()
  mockDuration.mockClear()
  mockTime.mockClear()
  mockTimeEnd.mockClear()
  mockRate.mockClear()
  mockCustom.mockClear()

  mocked(columnify).mockClear()
})

describe('base methods', () => {
  test('error', () => {
    const monitoring = createMonitoring()

    const error = new Error()
    monitoring.error(error)

    expect(mockError).toBeCalledWith(error)
  })

  test('execution', () => {
    const monitoring = createMonitoring()

    const error = new Error()
    monitoring.execution(error)

    expect(mockExecution).toBeCalledWith(error)
  })

  test('duration', () => {
    const monitoring = createMonitoring()
    monitoring.duration('test-label', 123)
    expect(mockDuration).toBeCalledWith('test-label', 123)
  })

  test('time and timeEnd', () => {
    const monitoring = createMonitoring()

    monitoring.time('test-label', 123)
    monitoring.timeEnd('test-label', 321)

    expect(mockTime).toBeCalledWith('test-label', 123)
    expect(mockTimeEnd).toBeCalledWith('test-label', 321)
  })

  test('rate', () => {
    const monitoring = createMonitoring()
    monitoring.rate('feeding', 123, 321)
    expect(mockRate).toBeCalledWith('feeding', 123, 321)
  })

  test('getMetrics', () => {
    const monitoring = createMonitoring()
    monitoring.getMetrics()
    expect(mockGetMetrics).toBeCalledWith()
  })

  test('clearMetrics', () => {
    const monitoring = createMonitoring()
    monitoring.clearMetrics()
    expect(mockClearMetrics).toBeCalledWith()
  })

  test('group', () => {
    const monitoring = createMonitoring()
    monitoring.group({ Part: 'Command' })
    expect(mockGroup).toBeCalledWith({ Part: 'Command' })
  })
})

describe('publish', () => {
  test('prints correct metrics if metric name is Executions', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Executions',
          unit: 'Count',
          dimensions: [
            { name: 'Part', value: 'Command' },
            { name: 'Aggregate', value: 'User1' },
          ],
          timestamp: 0,
          values: [1],
          counts: [3],
        },
        {
          metricName: 'Executions',
          unit: 'Count',
          dimensions: [
            { name: 'Part', value: 'Command' },
            { name: 'Aggregate', value: 'User2' },
          ],
          timestamp: 0,
          values: [1],
          counts: [2],
        },
        {
          metricName: 'Executions',
          unit: 'Count',
          dimensions: [
            { name: 'Part', value: 'ApiHandler' },
            { name: 'Path', value: '/metrics' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring()

    await monitoring.publish({ source: 'processExit' })

    expect(mockLog).toBeCalledWith('\n- Executions (Count) -\n')

    expect(columnify).toBeCalledWith(
      [
        {
          label: 'Command',
          count: 5,
        },
        {
          label: 'ApiHandler',
          count: 1,
        },
      ],
      expect.any(Object)
    )
  })

  test('prints correct metrics if metric name is Duration', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Duration',
          unit: 'Milliseconds',
          dimensions: [
            { name: 'Part', value: 'Command' },
            { name: 'Aggregate', value: 'User1' },
          ],
          timestamp: 0,
          values: [4, 5],
          counts: [2, 3],
        },
        {
          metricName: 'Duration',
          unit: 'Milliseconds',
          dimensions: [
            { name: 'Part', value: 'Command' },
            { name: 'Aggregate', value: 'User2' },
          ],
          timestamp: 0,
          values: [6, 2],
          counts: [6, 1],
        },
        {
          metricName: 'Duration',
          unit: 'Milliseconds',
          dimensions: [
            { name: 'Part', value: 'ApiHandler' },
            { name: 'Path', value: '/metrics' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring()

    await monitoring.publish({ source: 'processExit' })

    expect(mockLog).toBeCalledWith('\n- Command Duration (Milliseconds) -\n')

    expect(columnify).toBeCalledWith(
      [
        {
          label: 'User1',
          count: 5,
          avg: parseFloat(((4 * 2 + 5 * 3) / 5).toFixed(2)),
          min: 4,
          max: 5,
        },
        {
          label: 'User2',
          count: 7,
          avg: parseFloat(((6 * 6 + 2) / 7).toFixed(2)),
          min: 2,
          max: 6,
        },
      ],
      expect.any(Object)
    )

    expect(mockLog).toBeCalledWith('\n- ApiHandler Duration (Milliseconds) -\n')

    expect(columnify).toBeCalledWith(
      [
        {
          label: '/metrics',
          count: 1,
          avg: 1,
          min: 1,
          max: 1,
        },
      ],
      expect.any(Object)
    )
  })

  test('prints correct metrics if metric name is some custom value', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'MyCustomMetric',
          unit: 'Count/Second',
          dimensions: [
            { name: 'Part', value: 'Custom' },
            { name: 'Some', value: 'Value' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring()

    await monitoring.publish({ source: 'processExit' })

    expect(mockLog).toBeCalledWith('\n- MyCustomMetric (Count/Second) -\n')

    expect(columnify).toBeCalledWith(
      [
        {
          label: 'Part="Custom", Some="Value"',
          count: 1,
          avg: 1,
          min: 1,
          max: 1,
        },
      ],
      expect.any(Object)
    )
  })

  test('does nothing with no metric data on publish', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [],
    })

    const monitoring = createMonitoring()

    await monitoring.publish()

    expect(columnify).toBeCalledTimes(0)
  })
})
