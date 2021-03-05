import {
  Encryption,
  Event,
  SagaEventHandler,
  SagaInitHandler,
} from '../types/core'
import getLog from '../get-log'
import { wrapSideEffects } from './wrap-side-effects'
import { SagaRuntime, SideEffectsCollection, SystemSideEffects } from './types'

const buildSideEffects = (
  runtime: SagaRuntime,
  sideEffects: SideEffectsCollection,
  isEnabled: boolean
) => {
  const sagaProperties = runtime.eventProperties

  const customSideEffects =
    sideEffects != null && sideEffects.constructor === Object ? sideEffects : {}

  const systemSideEffects: SystemSideEffects = {
    executeCommand: runtime.executeCommand,
    executeQuery: runtime.executeQuery,
    uploader: runtime.uploader,
    secretsManager: runtime.secretsManager,
  }

  return {
    ...wrapSideEffects(
      sagaProperties,
      {
        ...customSideEffects,
        ...systemSideEffects,
      },
      isEnabled
    ),
    isEnabled,
  }
}

export const createInitHandler = (
  runtime: SagaRuntime,
  eventType: string,
  handler: SagaInitHandler<any, any>,
  sideEffects: SideEffectsCollection
) => async (store: any): Promise<void> => {
  const log = getLog(`saga-init-handler`)
  log.debug('[Init] handler side effects always enabled')
  const isEnabled = true

  await handler({
    store,
    sideEffects: buildSideEffects(runtime, sideEffects, isEnabled),
  })
}

export const createEventHandler = (
  runtime: SagaRuntime,
  eventType: string,
  handler: SagaEventHandler<any, any>,
  sideEffects: SideEffectsCollection,
  encryption: Encryption
) => async (store: any, event: Event): Promise<void> => {
  const log = getLog(`saga-event-handler`)

  log.debug(`preparing saga event [${eventType}] handler`)
  try {
    const sagaProperties = runtime.eventProperties
    const isEnabled = !isNaN(
      +sagaProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP
    )
      ? +sagaProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP <= +event.timestamp
      : true

    log.verbose(
      `RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: ${+sagaProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP}`
    )
    log.verbose(`isEnabled: ${isEnabled}`)
    log.debug(`invoking saga event [${eventType}] handler`)
    await handler(
      {
        store,
        sideEffects: buildSideEffects(runtime, sideEffects, isEnabled),
        ...encryption,
      },
      event
    )
  } catch (error) {
    log.error(error)
    throw error
  }
}
