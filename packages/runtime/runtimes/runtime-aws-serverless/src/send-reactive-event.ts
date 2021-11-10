import { getLog, pureRequire } from '@resolve-js/runtime-base'
import type { ReactiveEventDispatcher } from '@resolve-js/runtime-base'

export const sendReactiveEvent: ReactiveEventDispatcher = async (event) => {
  const { aggregateId, type } = event
  const log = getLog(`sendReactiveEvent:${event.type}`)
  let escapeId: any
  let escapeStr: any
  let executeStatement: any
  let errorBoundary: any
  let invokeFunction: any
  try {
    escapeId = pureRequire('resolve-cloud-common/postgres')
    escapeStr = pureRequire('resolve-cloud-common/postgres')
    executeStatement = pureRequire('resolve-cloud-common/postgres')
    errorBoundary = pureRequire('resolve-cloud-common/utils')
    invokeFunction = pureRequire('resolve-cloud-common/lambda')
  } catch {}
  const databaseNameAsId = escapeId(
    process.env.RESOLVE_EVENT_STORE_DATABASE_NAME as string
  )
  const subscriptionsTableNameAsId = escapeId(
    process.env.RESOLVE_SUBSCRIPTIONS_TABLE_NAME as string
  )

  const connectionIdsResult = await executeStatement({
    Region: process.env.AWS_REGION as string,
    ResourceArn: process.env.RESOLVE_EVENT_STORE_CLUSTER_ARN as string,
    SecretArn: process.env.RESOLVE_USER_SECRET_ARN as string,
    Sql: `SELECT "connectionId" FROM ${databaseNameAsId}.${subscriptionsTableNameAsId}
          WHERE (
             ${databaseNameAsId}.${subscriptionsTableNameAsId}."eventTypes" #>
             ${escapeStr(`{${JSON.stringify(type)}}`)} =
             CAST('true' AS jsonb)
            OR
             ${databaseNameAsId}.${subscriptionsTableNameAsId}."eventTypes" #> '{}' =
             CAST('null' AS jsonb) 
            ) AND (
             ${databaseNameAsId}.${subscriptionsTableNameAsId}."aggregateIds" #>
             ${escapeStr(`{${JSON.stringify(aggregateId)}}`)} =
             CAST('true' AS jsonb)
            OR
             ${databaseNameAsId}.${subscriptionsTableNameAsId}."aggregateIds" #> '{}' =
             CAST('null' AS jsonb) 
          )`,
  })

  const errors: any[] = []

  await Promise.all(
    connectionIdsResult.map(({ connectionId }: { connectionId: string }) =>
      invokeFunction({
        Region: process.env.AWS_REGION as string,
        FunctionName: process.env.RESOLVE_WEBSOCKET_LAMBDA_ARN as string,
        Payload: {
          type: 'send',
          connectionId,
          data: {
            type: 'events',
            payload: {
              events: [event],
            },
          },
        },
      }).catch(errorBoundary(errors))
    )
  )
  if (errors.length > 0) {
    log.warn(`Failed push event to websocket. ${errors}`)
  }
}
