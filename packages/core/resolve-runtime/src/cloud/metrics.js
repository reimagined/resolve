import CloudWatch from 'aws-sdk/clients/cloudwatch'

const kindByEvent = event => {
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
    const dimensions = [
      {
        Name: 'Deployment Id',
        Value: process.env.RESOLVE_DEPLOYMENT_ID
      },
      {
        Name: 'Kind',
        Value: kindByEvent(lambdaEvent)
      }
    ]

    const params = {
      MetricData: [
        {
          MetricName: 'duration',
          Dimensions: dimensions,
          Timestamp: now,
          Unit: 'Milliseconds',
          Value: duration
        }
      ],
      Namespace: 'RESOLVE_METRICS'
    }

    if (coldStart) {
      params.MetricData.push({
        MetricName: 'duration',
        Dimensions: [
          {
            Name: 'Deployment Id',
            Value: process.env.RESOLVE_DEPLOYMENT_ID
          },
          {
            Name: 'Kind',
            Value: 'cold start'
          }
        ],
        Timestamp: now,
        Unit: 'Milliseconds',
        Value: coldStartDuration
      })
    }
    await cloudWatch.putMetricData(params).promise()
  }
}

export default putMetrics
