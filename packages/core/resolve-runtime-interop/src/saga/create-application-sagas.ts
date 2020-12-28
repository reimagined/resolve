import { v4 as uuid } from 'uuid'
import { Command, CommandResult, Event } from 'resolve-core'
import getLog from '../get-log'
import { createEventHandler } from './create-event-handler'
import { ApplicationSagasBuilder } from './types'

const log = getLog('create-application-sagas')

const createCommandScheduler = (
  executeCommand: Function,
  schedulerName: string
) => async (date: number, command: Command): Promise<CommandResult> => {
  const aggregateId = uuid()
  log.debug(
    `creating scheduled command aggregate ${schedulerName} with id ${aggregateId}`
  )
  return executeCommand({
    aggregateName: schedulerName,
    aggregateId,
    type: 'create',
    payload: { date, command },
  })
}

export const createApplicationSagas: ApplicationSagasBuilder = (
  { sagas, schedulerName },
  runtime
) => {
  const commandScheduler = createCommandScheduler(
    runtime.executeCommand,
    schedulerName
  )

  return sagas.map(
    ({ name, handlers, sideEffects, connectorName, encryption }) => {
      const projection = Object.keys(handlers).reduce<{
        [key: string]: (store: any, event: Event) => Promise<void>
      }>((acc, eventType) => {
        acc[eventType] = createEventHandler(
          runtime,
          eventType,
          handlers[eventType],
          sideEffects,
          commandScheduler
        )
        return acc
      }, {})

      return {
        name,
        projection,
        resolvers: {},
        connectorName,
        encryption,
      }
    }
  )
}
