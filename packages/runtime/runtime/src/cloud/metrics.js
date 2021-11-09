import pureRequire from '../common/utils/pure-require'

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
    let CloudWatch
    try {
      CloudWatch = pureRequire('aws-sdk/clients/cloudwatch')
    } catch (error) {
      console.log('IMPORT ERROR', error)
    }
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
      Namespace: 'ResolveJs',
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
