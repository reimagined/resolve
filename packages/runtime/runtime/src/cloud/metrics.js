import CloudWatch from 'aws-sdk/clients/cloudwatch'

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

const buildExecutionMetricData = (config, dataMap, commonMap, errorMap) => {
  const now = new Date()

  const metricData = commonMap.map((dimensionNames) => ({
    MetricName: config.MetricName,
    Timestamp: now,
    Unit: config.Unit,
    Value: config.Value,
    Dimensions: dimensionNames.map((name) => ({
      Name: name,
      Value: dataMap[name],
    })),
  }))

  if (dataMap.ErrorMessage != null && errorMap != null) {
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

  return metricData
}

export const buildCommandMetricData = (
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

  let metricData = []

  const metricConfig = {
    MetricName: 'Executions',
    Unit: 'Count',
    Value: 1,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
    metricConfig.MetricName = 'Errors'

    metricData = metricData.concat(
      buildExecutionMetricData(metricConfig, metricDataMap, [
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
      ])
    )
  }

  return metricData.concat(
    buildExecutionMetricData(metricConfig, metricDataMap, [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'AggregateName'],
      ['DeploymentId', 'Part', 'AggregateName', 'CommandType'],
      ['DeploymentId', 'Part', 'AggregateName', 'CommandType', 'AggregateId'],
    ])
  )
}

export const buildReadModelProjectionMetricData = (
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

  let metricData = []

  const metricConfig = {
    MetricName: 'Executions',
    Unit: 'Count',
    Value: 1,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
    metricConfig.MetricName = 'Errors'

    metricData = metricData.concat(
      buildExecutionMetricData(metricConfig, metricDataMap, [
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
      ])
    )
  }

  return metricData.concat(
    buildExecutionMetricData(metricConfig, metricDataMap, [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'ReadModel'],
      ['DeploymentId', 'Part', 'ReadModel', 'EventType'],
    ])
  )
}

export const buildReadModelResolverMetricData = (
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

  let metricData = []

  const metricConfig = {
    MetricName: 'Executions',
    Unit: 'Count',
    Value: 1,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
    metricConfig.MetricName = 'Errors'

    metricData = metricData.concat(
      buildExecutionMetricData(metricConfig, metricDataMap, [
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
      ])
    )
  }

  return metricData.concat(
    buildExecutionMetricData(metricConfig, metricDataMap, [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'ReadModel'],
      ['DeploymentId', 'Part', 'ReadModel', 'Resolver'],
    ])
  )
}

export const buildViewModelProjectionMetricData = (
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

  let metricData = []

  const metricConfig = {
    MetricName: 'Executions',
    Unit: 'Count',
    Value: 1,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
    metricConfig.MetricName = 'Errors'

    metricData = metricData.concat(
      buildExecutionMetricData(metricConfig, metricDataMap, [
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
      ])
    )
  }

  return metricData.concat(
    buildExecutionMetricData(metricConfig, metricDataMap, [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'ViewModel'],
      ['DeploymentId', 'Part', 'ViewModel', 'EventType'],
    ])
  )
}

export const buildViewModelResolverMetricData = (viewModelName, error) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'ViewModelResolver',
    ViewModel: viewModelName,
  }

  let metricData = []

  const metricConfig = {
    MetricName: 'Executions',
    Unit: 'Count',
    Value: 1,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
    metricConfig.MetricName = 'Errors'

    metricData = metricData.concat(
      buildExecutionMetricData(metricConfig, metricDataMap, [
        ['DeploymentId', 'ErrorName'],
        ['DeploymentId', 'Part', 'ErrorName'],
        ['DeploymentId', 'Part', 'ViewModel', 'ErrorName'],
        ['DeploymentId', 'ErrorName', 'ErrorMessage'],
        ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
        ['DeploymentId', 'Part', 'ViewModel', 'ErrorName', 'ErrorMessage'],
      ])
    )
  }

  return metricData.concat(
    buildExecutionMetricData(metricConfig, metricDataMap, [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'ViewModel'],
    ])
  )
}

export const buildApiHandlerMetricData = (apiHandlerPath, error) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'ApiHandler',
    Path: apiHandlerPath,
  }

  let metricData = []

  const metricConfig = {
    MetricName: 'Executions',
    Unit: 'Count',
    Value: 1,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
    metricConfig.MetricName = 'Errors'

    metricData = metricData.concat(
      buildExecutionMetricData(metricConfig, metricDataMap, [
        ['DeploymentId', 'ErrorName'],
        ['DeploymentId', 'Part', 'ErrorName'],
        ['DeploymentId', 'Part', 'Path', 'ErrorName'],
        ['DeploymentId', 'ErrorName', 'ErrorMessage'],
        ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
        ['DeploymentId', 'Part', 'Path', 'ErrorName', 'ErrorMessage'],
      ])
    )
  }

  return metricData.concat(
    buildExecutionMetricData(metricConfig, metricDataMap, [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'Path'],
    ])
  )
}

export const buildSagaProjectionMetricData = (sagaName, eventType, error) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'SagaProjection',
    Saga: sagaName,
    EventType: eventType,
  }

  let metricData = []

  const metricConfig = {
    MetricName: 'Executions',
    Unit: 'Count',
    Value: 1,
  }

  if (error != null) {
    metricDataMap.ErrorMessage = getErrorMessage(error)
    metricDataMap.ErrorName = error.name
    metricConfig.MetricName = 'Errors'

    metricData = metricData.concat(
      buildExecutionMetricData(metricConfig, metricDataMap, [
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
      ])
    )
  }

  return metricData.concat(
    buildExecutionMetricData(metricConfig, metricDataMap, [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
      ['DeploymentId', 'Part', 'Saga'],
      ['DeploymentId', 'Part', 'Saga', 'EventType'],
    ])
  )
}

export const buildInternalExecutionMetricData = (error) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Part: 'Internal',
    ErrorMessage: getErrorMessage(error),
    ErrorName: error.name,
  }

  const metricConfig = {
    MetricName: 'Errors',
    Unit: 'Count',
    Value: 1,
  }

  return [].concat(
    buildExecutionMetricData(metricConfig, metricDataMap, [
      ['DeploymentId'],
      ['DeploymentId', 'Part'],
    ]),
    buildExecutionMetricData(metricConfig, metricDataMap, [
      ['DeploymentId', 'ErrorName'],
      ['DeploymentId', 'Part', 'ErrorName'],
      ['DeploymentId', 'ErrorName', 'ErrorMessage'],
      ['DeploymentId', 'Part', 'ErrorName', 'ErrorMessage'],
    ])
  )
}

export const buildDurationMetricData = (label, resolveVersion, duration) => {
  const metricDataMap = {
    DeploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    Label: label,
    ResolveVersion: resolveVersion,
  }

  const metricConfig = {
    MetricName: 'Duration',
    Unit: 'Milliseconds',
    Value: duration,
  }

  return buildExecutionMetricData(metricConfig, metricDataMap, [
    ['DeploymentId', 'Label'],
    ['ResolveVersion', 'Label'],
    ['DeploymentId', 'ResolveVersion', 'Label'],
  ])
}
