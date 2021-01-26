import { Event } from '../index'
import getLog from '../get-log'
import { wrapSideEffects } from './wrap-side-effects'
import { SagaRuntime, SideEffectsCollection, SystemSideEffects } from './types'

export const createEventHandler = (
  runtime: SagaRuntime,
  eventType: string,
  handler: Function,
  sideEffects: SideEffectsCollection,
  scheduleCommand: Function
) => async (store: any, event: Event): Promise<void> => {
  const log = getLog(`saga-event-handler`)

  log.debug(`preparing saga event [${eventType}] handler`)
  const sagaProperties = runtime.eventProperties
  const isEnabled = !isNaN(+sagaProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP)
    ? +sagaProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP <= +event.timestamp
    : true

  log.verbose(
    `RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: ${+sagaProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP}`
  )
  log.verbose(`isEnabled: ${isEnabled}`)

  const userSideEffects =
    sideEffects != null && sideEffects.constructor === Object ? sideEffects : {}

  const systemSideEffects: SystemSideEffects = {
    executeCommand: runtime.executeCommand,
    executeQuery: runtime.executeQuery,
    uploader: runtime.uploader,
    scheduleCommand,
    secretsManager: runtime.secretsManager,
  }

  log.debug(`invoking saga event [${eventType}] handler`)
  await handler(
    {
      store,
      sideEffects: {
        ...wrapSideEffects(
          sagaProperties,
          {
            ...userSideEffects,
            ...systemSideEffects,
          },
          isEnabled
        ),
        isEnabled,
      },
    },
    event
  )
}
