import jwt from 'jsonwebtoken'
import { getLog } from '@resolve-js/runtime-base'
import { invokeFunction } from 'resolve-cloud-common/lambda'
import {
  executeStatement,
  escapeId,
  escapeStr,
} from 'resolve-cloud-common/postgres'

import type { Adapter as EventStoreAdapter } from '@resolve-js/eventstore-base'
import type { WorkerResult } from './types'

const log = getLog('resolve:runtime:websocket-event-handler')

//TODO: check in runtime that these environment variables are defined?
const region = process.env.AWS_REGION as string
const websocketLambdaArn = process.env.RESOLVE_WEBSOCKET_LAMBDA_ARN as string
const eventStoreClusterArn = process.env
  .RESOLVE_EVENT_STORE_CLUSTER_ARN as string
const eventStoreDatabaseName = process.env
  .RESOLVE_EVENT_STORE_DATABASE_NAME as string
const subscriptionsTableName = process.env
  .RESOLVE_SUBSCRIPTIONS_TABLE_NAME as string
const userSecretArn = process.env.RESOLVE_USER_SECRET_ARN as string
const encryptedDeploymentId = process.env
  .RESOLVE_ENCRYPTED_DEPLOYMENT_ID as string

const LOAD_EVENTS_COUNT_LIMIT = 1000000
// 128kb is a limit for AWS WebSocket API message size
const LOAD_EVENTS_SIZE_LIMIT = 124 * 1024

const databaseNameAsId = escapeId(eventStoreDatabaseName)
const subscriptionsTableNameAsId = escapeId(subscriptionsTableName)

export const handleWebsocketEvent = async (
  {
    method,
    payload,
  }: {
    method: string
    payload: {
      queryString: { token: string }
      connectionId: string
      data: string
    }
  },
  {
    eventStoreAdapter,
  }: {
    eventStoreAdapter: EventStoreAdapter
  }
): Promise<WorkerResult> => {
  log.debug(`dispatching lambda event to websocket`)

  switch (method) {
    case 'connect': {
      const { queryString, connectionId } = payload
      const { token } = queryString
      const { eventTypes, aggregateIds } = jwt.verify(
        token,
        encryptedDeploymentId
      ) as {
        eventTypes: string[] | null
        aggregateIds: string[] | null
      }

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
      const { type, requestId, payload: messagePayload } = JSON.parse(data)

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

            const { events, cursor } = await eventStoreAdapter.loadEvents({
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
              cursor: messagePayload.cursor,
            })

            await invokeFunction({
              Region: region,
              FunctionName: websocketLambdaArn,
              Payload: {
                type: 'send',
                connectionId,
                data: {
                  type: 'pullEvents',
                  requestId,
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
  return { statusCode: 200 }
}
