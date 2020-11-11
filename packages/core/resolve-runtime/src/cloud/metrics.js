import CloudWatch from 'aws-sdk/clients/cloudwatch'

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

const putMetrics = async (
  lambdaEvent,
  lambdaContext,
  coldStart,
  lambdaRemainingTimeStart
) => {
  if (
    lambdaContext &&
    typeof lambdaContext.getRemainingTimeInMillis === 'function'
  ) {
    const cloudWatch = new CloudWatch()
    const coldStartDuration = 15 * 60 * 1000 - lambdaRemainingTimeStart
    const duration =
      lambdaRemainingTimeStart - lambdaContext.getRemainingTimeInMillis()
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

export const putErrorMetrics = async (error) => {
  const cw = new CloudWatch()

  const deploymentId = process.env.RESOLVE_DEPLOYMENT_ID

  if (deploymentId == null) {
    return
  }

  try {
    // const errorMessage =
    //   error.stack != null ? error.stack.replace(/\n/gm, '\\n') : error.message

    console.log('put error metrics')

    await cw
      .putMetricData({
        Namespace: 'RESOLVE_METRICS',
        MetricData: [
          {
            MetricName: 'Errors',
            Timestamp: new Date(),
            Unit: 'Count',
            Value: 1,
            Dimensions: [
              {
                Name: 'DeploymentId',
                Value: deploymentId
              },
              {
                Name: 'Error',
                Value: error.message
              }
            ]
          }
        ]
      })
      .promise()

    console.log('put error metrics succeeded')
  } catch (e) {
    console.log('put error metrics failed')
    console.warn(e)
  }
}

export default putMetrics
