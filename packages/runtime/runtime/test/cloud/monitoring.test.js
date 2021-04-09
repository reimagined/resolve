import CloudWatch from 'aws-sdk/clients/cloudwatch'

import createMonitoring from '../../src/cloud/monitoring'

import {
  buildApiHandlerMetricData,
  buildSagaProjectionMetricData,
  buildCommandMetricData,
  buildReadModelProjectionMetricData,
  buildReadModelResolverMetricData,
  buildViewModelProjectionMetricData,
  buildViewModelResolverMetricData,
  buildInternalExecutionMetricData,
  buildDurationMetricData,
} from '../../src/cloud/metrics'

jest.mock('../../src/cloud/metrics', () => ({
  buildApiHandlerMetricData: jest.fn(),
  buildSagaProjectionMetricData: jest.fn(),
  buildCommandMetricData: jest.fn(),
  buildReadModelProjectionMetricData: jest.fn(),
  buildReadModelResolverMetricData: jest.fn(),
  buildViewModelProjectionMetricData: jest.fn(),
  buildViewModelResolverMetricData: jest.fn(),
  buildInternalExecutionMetricData: jest.fn(),
  buildDurationMetricData: jest.fn(),
}))

afterEach(() => {
  CloudWatch.putMetricData.mockClear()

  buildApiHandlerMetricData.mockClear()
  buildSagaProjectionMetricData.mockClear()
  buildCommandMetricData.mockClear()
  buildReadModelProjectionMetricData.mockClear()
  buildReadModelResolverMetricData.mockClear()
  buildViewModelProjectionMetricData.mockClear()
  buildViewModelResolverMetricData.mockClear()
  buildInternalExecutionMetricData.mockClear()
  buildDurationMetricData.mockClear()
})

describe('error', () => {
  test('sends correct command metrics', async () => {
    const monitoring = createMonitoring()
    const error = new Error('test')

    buildCommandMetricData.mockReturnValueOnce(['command-metric-data'])

    monitoring.error(error, 'command', {
      command: {
        aggregateName: 'test-aggregate',
        aggregateId: 'test-id',
        type: 'test-type',
      },
    })

    await monitoring.publish()

    expect(buildCommandMetricData).toBeCalledWith(
      'test-aggregate',
      'test-type',
      'test-id',
      error
    )

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['command-metric-data'],
    })
  })

  test('sends correct read model projection metrics', async () => {
    const monitoring = createMonitoring()
    const error = new Error('test')

    buildReadModelProjectionMetricData.mockReturnValueOnce([
      'read-model-projection-metric-data',
    ])

    monitoring.error(error, 'readModelProjection', {
      readModelName: 'test-read-model',
      eventType: 'test-type',
    })

    await monitoring.publish()

    expect(buildReadModelProjectionMetricData).toBeCalledWith(
      'test-read-model',
      'test-type',
      error
    )

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['read-model-projection-metric-data'],
    })
  })

  test('sends correct read model resolver metrics', async () => {
    const monitoring = createMonitoring()
    const error = new Error('test')

    buildReadModelResolverMetricData.mockReturnValueOnce([
      'read-model-resolver-metric-data',
    ])

    monitoring.error(error, 'readModelResolver', {
      readModelName: 'test-read-model',
      resolverName: 'test-resolver',
    })

    await monitoring.publish()

    expect(buildReadModelResolverMetricData).toBeCalledWith(
      'test-read-model',
      'test-resolver',
      error
    )

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['read-model-resolver-metric-data'],
    })
  })

  test('sends correct saga projection metrics', async () => {
    const monitoring = createMonitoring()
    const error = new Error('test')

    buildSagaProjectionMetricData.mockReturnValueOnce([
      'saga-projection-metric-data',
    ])

    monitoring.error(error, 'sagaProjection', {
      sagaName: 'test-saga',
      eventType: 'test-type',
    })

    await monitoring.publish()

    expect(buildSagaProjectionMetricData).toBeCalledWith(
      'test-saga',
      'test-type',
      error
    )

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['saga-projection-metric-data'],
    })
  })

  test('sends correct view model projection metrics', async () => {
    const monitoring = createMonitoring()
    const error = new Error('test')

    buildViewModelProjectionMetricData.mockReturnValueOnce([
      'view-model-projection-metric-data',
    ])

    monitoring.error(error, 'viewModelProjection', {
      viewModelName: 'test-view-model',
      eventType: 'test-type',
    })

    await monitoring.publish()

    expect(buildViewModelProjectionMetricData).toBeCalledWith(
      'test-view-model',
      'test-type',
      error
    )

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['view-model-projection-metric-data'],
    })
  })

  test('sends correct view model resolver metrics', async () => {
    const monitoring = createMonitoring()
    const error = new Error('test')

    buildViewModelResolverMetricData.mockReturnValueOnce([
      'view-model-resolver-metric-data',
    ])

    monitoring.error(error, 'viewModelResolver', {
      viewModelName: 'test-view-model',
    })

    await monitoring.publish()

    expect(buildViewModelResolverMetricData).toBeCalledWith(
      'test-view-model',
      error
    )

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['view-model-resolver-metric-data'],
    })
  })

  test('sends correct api handler metrics', async () => {
    const monitoring = createMonitoring()
    const error = new Error('test')

    buildApiHandlerMetricData.mockReturnValueOnce(['api-handler-metric-data'])

    monitoring.error(error, 'apiHandler', {
      path: 'test-path',
    })

    await monitoring.publish()

    expect(buildApiHandlerMetricData).toBeCalledWith('test-path', error)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['api-handler-metric-data'],
    })
  })

  test('sends correct internal execution metrics', async () => {
    const monitoring = createMonitoring()
    const error = new Error('test')

    buildInternalExecutionMetricData.mockReturnValueOnce([
      'internal-metric-data',
    ])

    monitoring.error(error, 'internal')

    await monitoring.publish()

    expect(buildInternalExecutionMetricData).toBeCalledWith(error)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['internal-metric-data'],
    })
  })
})

describe('duration', () => {
  let originalNow

  beforeEach(() => {
    originalNow = Date.now
    Date.now = jest.fn()
  })

  afterEach(() => {
    Date.now = originalNow
  })

  test('sends correct duration metrics with specified timestamps', async () => {
    const monitoring = createMonitoring()

    buildDurationMetricData.mockReturnValueOnce(['duration-metric-data'])

    monitoring.time('test-label', 3000)
    monitoring.timeEnd('test-label', 5000)

    await monitoring.publish()

    expect(buildDurationMetricData).toBeCalledWith('test-label', 2000)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['duration-metric-data'],
    })
  })

  test('sends correct duration metrics using Date.now', async () => {
    const monitoring = createMonitoring()

    Date.now.mockReturnValueOnce(15000).mockReturnValueOnce(19500)

    buildDurationMetricData.mockReturnValueOnce(['duration-metric-data'])

    monitoring.time('test-label')
    monitoring.timeEnd('test-label')

    await monitoring.publish()

    expect(buildDurationMetricData).toBeCalledWith('test-label', 4500)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: ['duration-metric-data'],
    })
  })
})
