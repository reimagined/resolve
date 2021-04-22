import jwt from 'jsonwebtoken'
import { invokeFunction } from 'resolve-cloud-common/lambda'
import {
  executeStatement,
  escapeId,
  escapeStr,
} from 'resolve-cloud-common/postgres'
import debugLevels from '@resolve-js/debug-levels'

const log = debugLevels('resolve:runtime:websocket-event-handler')

const region = process.env.AWS_REGION
const websocketLambdaArn = process.env.RESOLVE_WEBSOCKET_LAMBDA_ARN
const eventStoreClusterArn = process.env.RESOLVE_EVENT_STORE_CLUSTER_ARN
const eventStoreDatabaseName = process.env.RESOLVE_EVENT_STORE_DATABASE_NAME
const subscriptionsTableName = process.env.RESOLVE_SUBSCRIPTIONS_TABLE_NAME
const userSecretArn = process.env.RESOLVE_USER_SECRET_ARN
const encryptedDeploymentId = process.env.RESOLVE_ENCRYPTED_DEPLOYMENT_ID

const LOAD_EVENTS_COUNT_LIMIT = 1000000
// 128kb is a limit for AWS WebSocket API message size
const LOAD_EVENTS_SIZE_LIMIT = 124 * 1024

const databaseNameAsId = escapeId(eventStoreDatabaseName)
const subscriptionsTableNameAsId = escapeId(subscriptionsTableName)

const handleWebsocketEvent = async ({ method, payload }, resolve) => {
  log.debug(`dispatching lambda event to websocket`)

  switch (method) {
    case 'connect': {
      const { queryString, connectionId } = payload
      const { token } = queryString
      const { eventTypes, aggregateIds } = jwt.verify(
        token,
        encryptedDeploymentId
      )

      const eventTypeMap =
        eventTypes != null
          ? eventTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {})
          : null
      const aggregateIdMap =
        aggregateIds != null
          ? aggregateIds.reduce((acc, id) => ({ ...acc, [id]: true }), {})
          : null

      await executeStatement({
        Region: region,
        ResourceArn: eventStoreClusterArn,
        SecretArn: userSecretArn,
        Sql: `INSERT INTO ${databaseNameAsId}.${subscriptionsTableNameAsId} (
            "connectionId",
            "eventTypes",
            "aggregateIds"
          ) VALUES (
            ${escapeStr(connectionId)},
            ${escapeStr(JSON.stringify(eventTypeMap))},
            ${escapeStr(JSON.stringify(aggregateIdMap))}
          )`,
      })
      break
    }
    case 'receive': {
      const { connectionId, data } = payload
      const { type, cursor: prevCursor } = JSON.parse(data)

      switch (type) {
        case 'pullEvents': {
          const connectionIdResult = await executeStatement({
            Region: region,
            ResourceArn: eventStoreClusterArn,
            SecretArn: userSecretArn,
            Sql: `SELECT * FROM ${databaseNameAsId}.${subscriptionsTableNameAsId}
              WHERE "connectionId" = ${escapeStr(connectionId)}`,
          })

          if (connectionIdResult[0] != null) {
            const { eventTypes, aggregateIds } = connectionIdResult[0]

            const { events, cursor } = await resolve.eventStore.loadEvents({
              eventTypes:
                eventTypes === JSON.stringify(null)
                  ? null
                  : Object.keys(JSON.parse(eventTypes)),
              aggregateIds:
                aggregateIds === JSON.stringify(null)
                  ? null
                  : Object.keys(JSON.parse(aggregateIds)),
              limit: LOAD_EVENTS_COUNT_LIMIT,
              eventsSizeLimit: LOAD_EVENTS_SIZE_LIMIT,
              cursor: prevCursor,
            })

            await invokeFunction({
              Region: region,
              FunctionName: websocketLambdaArn,
              Payload: {
                type: 'send',
                connectionId,
                data: {
                  type: 'pullEvents',
                  payload: { events, cursor },
                },
              },
            })
          }
          break
        }
        default: {
          throw new Error(`The '${type}' message type is unknown`)
        }
      }
      break
    }
    case 'disconnect': {
      const { connectionId } = payload

      await executeStatement({
        Region: region,
        ResourceArn: eventStoreClusterArn,
        SecretArn: userSecretArn,
        Sql: `DELETE FROM ${databaseNameAsId}.${subscriptionsTableNameAsId}
          WHERE "connectionId" = ${escapeStr(connectionId)}`,
      })
      break
    }
    default:
      throw new Error(`Wrong "${method}" websocket method`)
  }
}

export default handleWebsocketEvent
