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

// jest.mock('../../src/cloud/metrics', () => ({
//   buildApiHandlerMetricData: jest.fn(),
//   buildSagaProjectionMetricData: jest.fn(),
//   buildCommandMetricData: jest.fn(),
//   buildReadModelProjectionMetricData: jest.fn(),
//   buildReadModelResolverMetricData: jest.fn(),
//   buildViewModelProjectionMetricData: jest.fn(),
//   buildViewModelResolverMetricData: jest.fn(),
//   buildInternalExecutionMetricData: jest.fn(),
//   buildDurationMetricData: jest.fn(),
// }))

afterEach(() => {
  CloudWatch.putMetricData.mockClear()

  // buildApiHandlerMetricData.mockClear()
  // buildSagaProjectionMetricData.mockClear()
  // buildCommandMetricData.mockClear()
  // buildReadModelProjectionMetricData.mockClear()
  // buildReadModelResolverMetricData.mockClear()
  // buildViewModelProjectionMetricData.mockClear()
  // buildViewModelResolverMetricData.mockClear()
  // buildInternalExecutionMetricData.mockClear()
  // buildDurationMetricData.mockClear()
})

let originalNow

beforeEach(() => {
  originalNow = Date.now
  Date.now = jest.fn().mockReturnValue(1234)
})

afterEach(() => {
  Date.now = originalNow
})

describe('error', () => {
  test('sends error metrics with default dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message'))

    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: expect.any(Array),
    })

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(3)

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Errors',
        Unit: 'Count',
        Value: 1,
        Timestamp: 1234,
        Dimensions: expect.any(Array),
      })
    }

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })

  test('sends error metrics with group dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const groupMonitoring = monitoring.group({
      'test-group-name': 'test-group',
    })

    class TestError extends Error {
      name = 'test-error'
    }

    groupMonitoring.error(new TestError('test-message'))

    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: expect.any(Array),
    })

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(6)

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Errors',
        Unit: 'Count',
        Value: 1,
        Timestamp: 1234,
        Dimensions: expect.any(Array),
      })
    }

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group-name', Value: 'test-group' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group-name', Value: 'test-group' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group-name', Value: 'test-group' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })

  test('sends error metrics with second-level group dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const groupMonitoring = monitoring
      .group({
        'first-group-name': 'first-group',
      })
      .group({
        'second-group-name': 'second-group',
      })

    class TestError extends Error {
      name = 'test-error'
    }

    groupMonitoring.error(new TestError('test-message'))

    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: expect.any(Array),
    })

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(9)

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Errors',
        Unit: 'Count',
        Value: 1,
        Timestamp: 1234,
        Dimensions: expect.any(Array),
      })
    }

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'second-group-name', Value: 'second-group' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'second-group-name', Value: 'second-group' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'second-group-name', Value: 'second-group' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })

  test.skip('sends correct command metrics', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

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

  test.skip('sends correct read model projection metrics', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

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

  test.skip('sends correct read model resolver metrics', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

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

  test.skip('sends correct saga projection metrics', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

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

  test.skip('sends correct view model projection metrics', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

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

  test.skip('sends correct view model resolver metrics', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

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

  test.skip('sends correct api handler metrics', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

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

  test.skip('sends correct internal execution metrics', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

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
  test('sends duration metrics with default dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.time('test-label', 1000)
    monitoring.timeEnd('test-label', 2000)

    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: expect.any(Array),
    })

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(3)

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Value: 1000,
        Timestamp: 1234,
        Dimensions: expect.any(Array),
      })
    }

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )
  })

  test('sends duration metrics with dimensions extended by group data', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const monitoringGroup = monitoring.group({
      'test-group': 'test-group-name',
    })

    monitoringGroup.time('test-label', 1000)
    monitoringGroup.timeEnd('test-label', 2000)

    await monitoringGroup.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: expect.any(Array),
    })

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(3)

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Value: 1000,
        Timestamp: 1234,
        Dimensions: expect.any(Array),
      })
    }

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )
  })

  test('sends duration metrics with dimensions extended by group data if root monitoring publish is called', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const monitoringGroup = monitoring.group({
      'test-group': 'test-group-name',
    })

    monitoringGroup.time('test-label', 1000)
    monitoringGroup.timeEnd('test-label', 2000)

    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: expect.any(Array),
    })

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(3)

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Value: 1000,
        Timestamp: 1234,
        Dimensions: expect.any(Array),
      })
    }

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )
  })

  test('sends correct duration metrics with specified timestamps', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.time('test-label', 3000)
    monitoring.timeEnd('test-label', 5000)

    await monitoring.publish()

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Value: 2000,
        Timestamp: 1234,
        Dimensions: expect.any(Array),
      })
    }
  })

  test('sends correct duration metrics using Date.now', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    Date.now.mockReturnValueOnce(15000).mockReturnValueOnce(19500)

    monitoring.time('test-label')
    monitoring.timeEnd('test-label')

    await monitoring.publish()

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Value: 4500,
        Timestamp: 1234,
        Dimensions: expect.any(Array),
      })
    }
  })
})
