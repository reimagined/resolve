import {
  Encryption,
  Event,
  SagaEventHandler,
  SagaInitHandler,
  SideEffectsCollection,
} from '../types/core'
import { getLog } from '../get-log'
import { wrapSideEffects } from './wrap-side-effects'
import { SagaRuntime, SystemSideEffects, SideEffectsContext } from './types'

const buildSideEffects = (
  runtime: SagaRuntime,
  sideEffects: SideEffectsCollection,
  isEnabled: boolean,
  sideEffectsContext: SideEffectsContext
) => {
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
      {
        ...customSideEffects,
        ...systemSideEffects,
      },
      isEnabled,
      sideEffectsContext
    ),
    isEnabled,
  }
}

export const createInitHandler = (
  sagaName: string,
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
    sideEffects: buildSideEffects(runtime, sideEffects, isEnabled, {
      sideEffectsStartTimestamp: 0,
    }),
  })
}

export const createEventHandler = (
  sagaName: string,
  runtime: SagaRuntime,
  eventType: string,
  handler: SagaEventHandler<any, any>,
  sideEffects: SideEffectsCollection,
  encryption: Encryption
) => async (store: any, event: Event): Promise<void> => {
  const log = getLog(`saga-event-handler`)

  log.debug(`preparing saga event [${eventType}] handler`)
  try {
    const sideEffectsTimestamp = await runtime.getSideEffectsTimestamp(sagaName)

    const isEnabled = !isNaN(+sideEffectsTimestamp)
      ? +sideEffectsTimestamp < +event.timestamp
      : true

    if (
      !isNaN(+sideEffectsTimestamp) &&
      +event.timestamp > +sideEffectsTimestamp
    ) {
      await runtime.setSideEffectsTimestamp(sagaName, +event.timestamp)
    }

    log.verbose(
      `RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: ${+sideEffectsTimestamp}`
    )
    log.verbose(`isEnabled: ${isEnabled}`)
    log.debug(`invoking saga event [${eventType}] handler`)
    await handler(
      {
        store,
        sideEffects: buildSideEffects(runtime, sideEffects, isEnabled, {
          sideEffectsStartTimestamp: +sideEffectsTimestamp,
        }),
        ...encryption,
      },
      event
    )
  } catch (error) {
    log.error(error)
    throw error
  }
}
