import CloudWatch from 'aws-sdk/clients/cloudwatch'

import createMonitoring from '../../src/cloud/monitoring'

afterEach(() => {
  CloudWatch.putMetricData.mockClear()
})

let originalNow

beforeEach(() => {
  originalNow = Date.now
  Date.now = jest.fn().mockReturnValue(1234)
})

afterEach(() => {
  Date.now = originalNow
})

describe('common', () => {
  test('sends correct metric data on publish', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.error(new Error('test'))

    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.putMetricData).toBeCalledWith({
      Namespace: 'RESOLVE_METRICS',
      MetricData: expect.any(Array),
    })
  })

  test('does nothing with no metric data on publish', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(0)
  })

  test('sends metric data multiple times on multiple publish call', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.error(new Error('test-1'))
    await monitoring.publish()

    monitoring.error(new Error('test-2'))
    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(2)

    expect(CloudWatch.putMetricData).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'Error' },
              { Name: 'ErrorMessage', Value: 'test-1' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).not.toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'Error' },
              { Name: 'ErrorMessage', Value: 'test-2' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'Error' },
              { Name: 'ErrorMessage', Value: 'test-2' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.putMetricData).not.toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'Error' },
              { Name: 'ErrorMessage', Value: 'test-1' },
            ],
          }),
        ]),
      })
    )
  })

  test('combines multiple metric data', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.error(new Error('test-error'))
    monitoring.time('test', 500)
    monitoring.timeEnd('test', 800)

    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Errors',
            Unit: 'Count',
            Value: 1,
            Timestamp: expect.any(Date),
            Dimensions: expect.any(Array),
          },
        ]),
      })
    )

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Duration',
            Unit: 'Milliseconds',
            Value: 300,
            Timestamp: expect.any(Date),
            Dimensions: expect.any(Array),
          },
        ]),
      })
    )
  })

  test('splits metrics sending if metric data array has length more than 20', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    for (let i = 0; i < 8; i++) {
      monitoring.error(new Error(`test-${i + 1}`))
    }

    await monitoring.publish()

    expect(CloudWatch.putMetricData).toBeCalledTimes(2)

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(
      20
    )

    expect(CloudWatch.putMetricData.mock.calls[1][0].MetricData).toHaveLength(4)
  })

  test('does not reject on publish if putMetricData is failed', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.error(new Error('test'))

    CloudWatch.putMetricData.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('Something went wrong')),
    })

    await monitoring.publish()
  })
})

describe('error', () => {
  test('sends correct metrics base data', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    }).group({ 'test-group-name': 'test-group' })

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message'))

    await monitoring.publish()

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Errors',
        Unit: 'Count',
        Value: 1,
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test('contains default dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message'))

    await monitoring.publish()

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(3)

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

  test('contains default and group dimensions', async () => {
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

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(6)

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

  test('contains default and group dimensions for multiple group calls', async () => {
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

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(9)

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

  test('contains correct dimensions if multiple errors are passed', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message-1'))
    monitoring.error(new TestError('test-message-2'))

    await monitoring.publish()

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(6)

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message-2' },
            ],
          }),
        ]),
      })
    )
  })
})

describe('duration', () => {
  test('sends correct metrics base data', async () => {
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

    for (const metricData of CloudWatch.putMetricData.mock.calls[0][0]
      .MetricData) {
      expect(metricData).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Value: 1000,
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test('contains default dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.time('test-label', 1000)
    monitoring.timeEnd('test-label', 2000)

    await monitoring.publish()

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(3)

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

  test('contains default and group dimensions', async () => {
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

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(3)

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
        Timestamp: expect.any(Date),
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
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test('sends correct metrics with multiple labels', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.time('test-label-1', 1000)
    monitoring.timeEnd('test-label-1', 2000)

    monitoring.time('test-label-2', 1000)
    monitoring.timeEnd('test-label-2', 2000)

    await monitoring.publish()

    expect(CloudWatch.putMetricData.mock.calls[0][0].MetricData).toHaveLength(6)

    expect(CloudWatch.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Label', Value: 'test-label-1' },
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
              { Name: 'Label', Value: 'test-label-2' },
            ],
          }),
        ]),
      })
    )
  })
})
