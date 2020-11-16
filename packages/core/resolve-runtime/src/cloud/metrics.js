import CloudWatch from 'aws-sdk/clients/cloudwatch'
import debugLevels from 'resolve-debug-levels'

const MAX_METRICS_DIMENSION_VALUE_LENGTH = 256

const kindByEvent = (event) => {
  const { part, path = '' } = event
  if (part === 'bootstrap') {
    return 'bootstrapping'
  } else if (path.includes('/api/query')) {
    return 'query'
  } else if (path.includes('/api/commands')) {
    return 'command'
  } else if (path.includes('/api/subscribe')) {
    return 'subscribe'
  } else {
    return 'route'
  }
}

export const putDurationMetrics = async (
  lambdaEvent,
  lambdaContext,
  coldStart,
  lambdaRemainingTimeStart
) => {
  if (
    lambdaContext &&
    typeof lambdaContext.getVacantTimeInMillis === 'function'
  ) {
    const cloudWatch = new CloudWatch()
    const coldStartDuration = 15 * 60 * 1000 - lambdaRemainingTimeStart
    const duration =
      lambdaRemainingTimeStart - lambdaContext.getVacantTimeInMillis()
    const now = new Date()
    const kind = kindByEvent(lambdaEvent)
    const dimensions = [
      {
        Name: 'Deployment Id',
        Value: process.env.RESOLVE_DEPLOYMENT_ID,
      },
      {
        Name: 'Kind',
        Value: kind,
      },
    ]

    const params = {
      MetricData: [
        {
          MetricName: 'duration',
          Dimensions: dimensions,
          Timestamp: now,
          Unit: 'Milliseconds',
          Value: duration,
        },
      ],
      Namespace: 'RESOLVE_METRICS',
    }

    if (coldStart) {
      params.MetricData.push({
        MetricName: 'duration',
        Dimensions: [
          {
            Name: 'Deployment Id',
            Value: process.env.RESOLVE_DEPLOYMENT_ID,
          },
          {
            Name: 'Kind',
            Value: 'cold start',
          },
        ],
        Timestamp: now,
        Unit: 'Milliseconds',
        Value: coldStartDuration,
      })
    }
    // eslint-disable-next-line no-console
    console.info(
      ['[REQUEST INFO]', kind, lambdaEvent.path, duration].join('\n')
    )
    await cloudWatch.putMetricData(params).promise()
  }
}

export const putErrorMetrics = async (error, part) => {
  const cw = new CloudWatch()
  const log = debugLevels('resolve:resolve-runtime:cloud-entry:putErrorMetrics')

  const deploymentId = process.env.RESOLVE_DEPLOYMENT_ID

  if (deploymentId == null) {
    log.warn('Deployment ID not found')
    return
  }

  try {
    const now = new Date()
    let errorMessage = error.message

    if (errorMessage.length > MAX_METRICS_DIMENSION_VALUE_LENGTH) {
      const messageEnd = '...'
      errorMessage = `${errorMessage.slice(
        0,
        MAX_METRICS_DIMENSION_VALUE_LENGTH - messageEnd.length
      )}${messageEnd}`
    }

    await cw
      .putMetricData({
        Namespace: 'RESOLVE_METRICS',
        MetricData: [
          {
            MetricName: 'Errors',
            Timestamp: now,
            Unit: 'Count',
            Value: 1,
            Dimensions: [
              {
                Name: 'DeploymentId',
                Value: deploymentId,
              },
              {
                Name: 'Part',
                Value: part,
              },
              {
                Name: 'Error',
                Value: errorMessage,
              },
            ],
          },
          {
            MetricName: 'Errors',
            Timestamp: now,
            Unit: 'Count',
            Value: 1,
            Dimensions: [
              {
                Name: 'DeploymentId',
                Value: deploymentId,
              },
              {
                Name: 'Part',
                Value: part,
              },
            ],
          },
          {
            MetricName: 'Errors',
            Timestamp: now,
            Unit: 'Count',
            Value: 1,
            Dimensions: [
              {
                Name: 'DeploymentId',
                Value: deploymentId,
              },
            ],
          },
        ],
      })
      .promise()

    log.verbose('Put metrics succeeded')
  } catch (e) {
    log.verbose('Put metrics failed')
    log.warn(e)
  }
}
