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
})
