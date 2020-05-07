import getLog from './get-log'
import wrapSideEffects from './wrap-side-effects'

const sagaEventHandler = async (
  sagaProvider,
  handlers,
  sideEffects,
  eventType,
  scheduleCommand,
  store,
  event
) => {
  const log = getLog(`saga-event-handler`)

  log.debug(`preparing saga event [${eventType}] handler`)
  const eventProperties = sagaProvider.eventProperties
  const isEnabled =
    +eventProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP <= +event.timestamp

  log.verbose(
    `RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: ${+eventProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP}`
  )
  log.verbose(`isEnabled: ${isEnabled}`)

  const applicationSideEffects =
    sideEffects != null && sideEffects.constructor === Object ? sideEffects : {}

  log.debug(`building event store secrets manager`)
  const secretsManager = await sagaProvider.getSecretsManager()

  log.debug(`invoking saga event [${eventType}] handler`)
  await handlers[eventType](
    {
      sideEffects: {
        ...wrapSideEffects(
          eventProperties,
          {
            ...applicationSideEffects,
            executeCommand: sagaProvider.executeCommand,
            executeQuery: sagaProvider.executeQuery,
            scheduleCommand,
            secretsManager,
            uploader: sagaProvider.uploader
          },
          isEnabled
        ),
        isEnabled
      },
      store
    },
    event
  )
}

export default sagaEventHandler
