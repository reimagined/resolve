import CloudWatch from 'aws-sdk/clients/cloudwatch'
import debugLevels from '@resolve-js/debug-levels'

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

const getErrorMessage = (error) => {
  let errorMessage = error.message

  if (errorMessage.length > MAX_METRICS_DIMENSION_VALUE_LENGTH) {
    const messageEnd = '...'

    errorMessage = `${errorMessage.slice(
      0,
      MAX_METRICS_DIMENSION_VALUE_LENGTH - messageEnd.length
    )}${messageEnd}`
  }

  return errorMessage
}

const putDataMetrics = async (dataMap, commonMap, errorMap) => {
  const log = debugLevels('resolve:runtime:cloud-entry:putDataMetrics')
  const cw = new CloudWatch()

  if (dataMap.DeploymentId == null) {
    log.warn('Deployment ID not found')
    return
  }

  const now = new Date()
  const metricName = dataMap.ErrorMessage != null ? 'Errors' : 'Executions'

  const metricData = commonMap.map((dimensionNames) => ({
    MetricName: metricName,
    Timestamp: now,
    Unit: 'Count',
    Value: 1,
    Dimensions: dimensionNames.map((name) => ({
      Name: name,
      Value: dataMap[name],
    })),
  }))

  if (dataMap.Error != null && errorMap != null) {
    metricData.push(
      ...errorMap.map((dimensionNames) => ({
        MetricName: 'Errors',
        Timestamp: now,
        Unit: 'Count',
        Value: 1,
        Dimensions: dimensionNames.map((name) => ({
          Name: name,
          Value: dataMap[name],
        })),
      }))
    )
  }

  try {
    await cw
      .putMetricData({
        Namespace: 'RESOLVE_METRICS',
        MetricData: metricData,
      })
      .promise()

    log.verbose('Put metrics succeeded')
  } catch (e) {
    log.verbose('Put metrics failed')
    log.warn(e)
  }
}

export const putCommandMetrics = async (
  aggregateName,
  commandType,
  aggregateId,
  error
) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'Command',
    AggregateName: aggregateName,
    CommandType: commandType,
    AggregateId: aggregateId,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
  }

  return putDataMetrics(
    metricDataMap,
    [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'AggregateName'],
      ['DeploymentId', 'Part', 'AggregateName', 'CommandType'],
      ['DeploymentId', 'Part', 'AggregateName', 'CommandType', 'AggregateId'],
    ],
    [
      ['DeploymentId', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'ErrorName'],
      ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'ErrorName'],
      [
        'DeploymentId',
        'Part',
        'AggregateName',
        'CommandType',
        'AggregateId',
        'ErrorName',
        'ErrorMessage',
      ],
      [
        'DeploymentId',
        'Part',
        'AggregateName',
        'CommandType',
        'AggregateId',
        'ErrorName',
      ],
    ]
  )
}

export const putReadModelProjectionMetrics = async (
  readModelName,
  eventType,
  error
) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'ReadModelProjection',
    ReadModel: readModelName,
    EventType: eventType,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
  }

  return putDataMetrics(
    metricDataMap,
    [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'ReadModel'],
      ['DeploymentId', 'Part', 'ReadModel', 'EventType'],
    ],
    [
      ['DeploymentId', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
      [
        'DeploymentId',
        'Part',
        'ReadModel',
        'EventType',
        'ErrorName',
        'ErrorMessage',
      ],
      ['DeploymentId', 'ErrorName'],
      ['DeploymentId', 'Part', 'ErrorName'],
      ['DeploymentId', 'Part', 'ReadModel', 'EventType', 'ErrorName'],
    ]
  )
}

export const putReadModelResolverMetrics = async (
  readModelName,
  resolverName,
  error
) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'ReadModelResolver',
    ReadModel: readModelName,
    Resolver: resolverName,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
  }

  return putDataMetrics(
    metricDataMap,
    [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'ReadModel'],
      ['DeploymentId', 'Part', 'ReadModel', 'Resolver'],
    ],
    [
      ['DeploymentId', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
      [
        'DeploymentId',
        'Part',
        'ReadModel',
        'Resolver',
        'ErrorName',
        'ErrorMessage',
      ],
      ['DeploymentId', 'ErrorName'],
      ['DeploymentId', 'Part', 'ErrorName'],
      ['DeploymentId', 'Part', 'ReadModel', 'Resolver', 'ErrorName'],
    ]
  )
}

export const putViewModelProjectionMetrics = async (
  viewModelName,
  eventType,
  error
) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'ViewModelProjection',
    ViewModel: viewModelName,
    EventType: eventType,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
  }

  return putDataMetrics(
    metricDataMap,
    [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'ViewModel'],
      ['DeploymentId', 'Part', 'ViewModel', 'EventType'],
    ],
    [
      ['DeploymentId', 'ErrorName'],
      ['DeploymentId', 'Part', 'ErrorName'],
      ['DeploymentId', 'Part', 'ViewModel', 'EventType', 'ErrorName'],
      ['DeploymentId', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
      [
        'DeploymentId',
        'Part',
        'ViewModel',
        'EventType',
        'ErrorName',
        'ErrorMessage',
      ],
    ]
  )
}

export const putViewModelResolverMetrics = async (viewModelName, error) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'ViewModelResolver',
    ViewModel: viewModelName,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
  }

  return putDataMetrics(
    metricDataMap,
    [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'ViewModel'],
    ],
    [
      ['DeploymentId', 'ErrorName'],
      ['DeploymentId', 'Part', 'ErrorName'],
      ['DeploymentId', 'Part', 'ViewModel', 'ErrorName'],
      ['DeploymentId', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'ViewModel', 'ErrorName', 'ErrorMessage'],
    ]
  )
}

export const putApiHandlerMetrics = async (apiHandlerPath, error) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'ApiHandler',
    Path: apiHandlerPath,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
  }

  return putDataMetrics(
    metricDataMap,
    [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'Path'],
    ],
    [
      ['DeploymentId', 'ErrorName'],
      ['DeploymentId', 'Part', 'ErrorName'],
      ['DeploymentId', 'Part', 'Path', 'ErrorName'],
      ['DeploymentId', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'Path', 'ErrorName', 'ErrorMessage'],
    ]
  )
}

export const putSagaMetrics = async (sagaName, eventType, error) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'SagaProjection',
    Saga: sagaName,
    EventType: eventType,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
  }

  return putDataMetrics(
    metricDataMap,
    [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'Saga'],
      ['DeploymentId', 'Part', 'Saga', 'EventType'],
    ],
    [
      ['DeploymentId', 'ErrorName'],
      ['DeploymentId', 'Part', 'ErrorName'],
      ['DeploymentId', 'Part', 'Saga', 'EventType', 'ErrorName'],
      ['DeploymentId', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
      [
        'DeploymentId',
        'Part',
        'Saga',
        'EventType',
        'ErrorName',
        'ErrorMessage',
      ],
    ]
  )
}

export const putInternalError = async (error) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'Internal',
    ErrorMessage: getErrorMessage(error),
    ErrorName: error.name,
  }

  return putDataMetrics(metricDataMap, [
    ['DeploymentId', 'ErrorName'],
    ['DeploymentId', 'Part', 'ErrorName'],
    ['DeploymentId', 'ErrorName', 'ErrorMessage'],
    ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
  ])
}
