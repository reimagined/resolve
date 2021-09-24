// TODO: migrate to TS
import type { Request, AWSError } from 'aws-sdk'
import CloudWatch, { PutMetricDataInput } from 'aws-sdk/clients/cloudwatch'
import { mocked } from 'ts-jest/utils'

import createMonitoring from '../src'

afterEach(() => {
  mocked(CloudWatch.prototype.putMetricData).mockClear()
})

let originalNow: typeof Date.now
let dateSpy: jest.SpyInstance | null

beforeEach(() => {
  originalNow = Date.now
  Date.now = jest.fn().mockReturnValue(1234)
})

afterEach(() => {
  Date.now = originalNow

  if (dateSpy != null) {
    dateSpy.mockRestore()
    dateSpy = null
  }
})

describe('common', () => {
  test('sends correct metric data on publish', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.error(new Error('test'))

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })
  })

  test('ignores milliseconds in timestamp', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    }).group({ 'test-group-name': 'test-group' })

    const mockDate = new Date(1625152712546)
    const expectedDate = new Date(1625152712000)

    dateSpy = jest
      .spyOn(global, 'Date')
      .mockReturnValue((mockDate as unknown) as string)

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message'))

    await monitoring.publish()

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual(
        expect.objectContaining({
          Timestamp: expectedDate,
        })
      )
    }
  })

  test('does nothing with no metric data on publish', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(0)
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(2)

    expect(CloudWatch.prototype.putMetricData).toHaveBeenNthCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).not.toHaveBeenNthCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toHaveBeenNthCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).not.toHaveBeenNthCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Errors',
            Unit: 'Count',
            Values: [1],
            Counts: [1],
            Timestamp: expect.any(Date),
            Dimensions: expect.any(Array),
          },
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Duration',
            Unit: 'Milliseconds',
            Values: [300],
            Counts: [1],
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(2)

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(20)

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[1][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(4)
  })

  test('does not reject on publish if putMetricData is failed', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.error(new Error('test'))

    mocked(CloudWatch.prototype.putMetricData).mockReturnValueOnce({
      promise: () => Promise.reject(new Error('Something went wrong')),
    } as Request<PutMetricDataInput, AWSError>)

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

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Errors',
        Unit: 'Count',
        Values: [1],
        Counts: [1],
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

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(9)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

  test('contains global dimensions if Part dimension is specified', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.group({ Part: 'test-part' }).error(new TestError('test-message'))

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(7)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'Part', Value: 'test-part' }],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Part', Value: 'test-part' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )
  })
})

describe('executions', () => {
  test('sends correct metrics without error', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    }).group({ 'test-group-name': 'test-group' })

    monitoring.execution()

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Executions',
            Unit: 'Count',
            Values: [1],
            Counts: [1],
            Timestamp: expect.any(Date),
            Dimensions: expect.any(Array),
          },
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Errors',
            Unit: 'Count',
            Values: [0],
            Counts: [1],
            Timestamp: expect.any(Date),
            Dimensions: expect.any(Array),
          },
        ]),
      })
    )
  })

  test('sends correct metrics with error', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    }).group({ 'test-group-name': 'test-group' })

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.execution(new TestError('test-message'))

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Executions',
            Unit: 'Count',
            Values: [1],
            Counts: [1],
            Timestamp: expect.any(Date),
            Dimensions: expect.any(Array),
          },
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Errors',
            Unit: 'Count',
            Values: [1],
            Counts: [1],
            Timestamp: expect.any(Date),
            Dimensions: expect.any(Array),
          },
        ]),
      })
    )
  })

  test('contains default dimensions with error', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.execution(new TestError('test-message'))

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(4)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })

  test('contains default dimensions without error', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.execution()

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(2)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })

  test('contains default and group dimensions for multiple group calls with error', async () => {
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

    groupMonitoring.execution(new TestError('test-message'))

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(12)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })

  test('contains default and group dimensions for multiple group calls without error', async () => {
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

    groupMonitoring.execution()

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })
})

describe('time and timeEnd', () => {
  test('sends correct metrics base data', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.time('test-label', 1000)
    monitoring.timeEnd('test-label', 2000)

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Values: [1000],
        Counts: [1],
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

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Values: [2000],
        Counts: [1],
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

    mocked(Date.now).mockReturnValueOnce(15000).mockReturnValueOnce(19500)

    monitoring.time('test-label')
    monitoring.timeEnd('test-label')

    await monitoring.publish()

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Values: [4500],
        Counts: [1],
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

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

describe('duration', () => {
  test('sends correct metrics base data', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.duration('test-label', 1000)

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Values: [1000],
        Counts: [1],
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test('sends correct metrics with custom count', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.duration('test-label', 1000, 5)

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Values: [1000],
        Counts: [5],
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

    monitoring.duration('test-label', 1000)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    monitoringGroup.duration('test-label', 1000)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

  test('sends correct metrics with multiple labels', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.duration('test-label-1', 1000)
    monitoring.duration('test-label-2', 1000)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
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

  test('combines different values with same dimensions if metric put in the same second', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const mockDate = new Date(1625152712546)

    dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => (mockDate as unknown) as string)

    monitoring.duration('test-label', 200, 5)
    monitoring.duration('test-label', 300, 3)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: [200, 300],
            Counts: [5, 3],
          }),
        ]),
      })
    )
  })

  test('combines different values with same dimensions up to 150 samples', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const mockDate = new Date(1625152712546)

    dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => (mockDate as unknown) as string)

    for (let i = 0; i < 200; i++) {
      monitoring.duration('test-label', i)
    }

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: Array.from({ length: 150 }, (_, i) => i),
            Counts: Array.from({ length: 150 }, () => 1),
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: Array.from({ length: 50 }, (_, i) => i + 150),
            Counts: Array.from({ length: 50 }, () => 1),
          }),
        ]),
      })
    )
  })

  test('combines different values with same dimensions up to 150 samples considering value', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const mockDate = new Date(1625152712546)

    dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => (mockDate as unknown) as string)

    for (let i = 0; i < 150; i++) {
      monitoring.duration('test-label', i)
    }

    monitoring.duration('test-label', 69)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: Array.from({ length: 150 }, (_, i) => i),
            Counts: Array.from({ length: 150 }, (_, i) => (i === 69 ? 2 : 1)),
          }),
        ]),
      })
    )
  })

  test('combines same values with same dimensions if metric put in the same second', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const mockDate = new Date(1625152712546)

    dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => (mockDate as unknown) as string)

    monitoring.duration('test-label', 200, 5)
    monitoring.duration('test-label', 200, 3)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: [200],
            Counts: [8],
          }),
        ]),
      })
    )
  })

  test('does not combine different values with same dimensions if metric put in different seconds', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const firstDate = new Date(1625152712546)
    const secondDate = new Date(1625152713121)

    dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementationOnce(() => (firstDate as unknown) as string)
      .mockImplementationOnce(() => (secondDate as unknown) as string)

    monitoring.duration('test-label', 200, 5)
    monitoring.duration('test-label', 300, 3)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: [200],
            Counts: [5],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: [300],
            Counts: [3],
          }),
        ]),
      })
    )
  })
})

describe('rate', () => {
  test('sends correct metrics base data', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.rate('applied-events', 123)

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'applied-events',
        Unit: 'Count/Second',
        Values: [123],
        Counts: [1],
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test('sends correct metrics base data if seconds are specified', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.rate('applied-events', 15, 0.5)

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'applied-events',
        Unit: 'Count/Second',
        Values: [30],
        Counts: [1],
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

    monitoring.rate('applied-events', 123)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'ResolveVersion', Value: '1.0.0-test' }],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
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

    monitoringGroup.rate('applied-events', 1000)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group', Value: 'test-group-name' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
            ],
          }),
        ]),
      })
    )
  })
})
