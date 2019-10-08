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
  const eventProperties = sagaProvider.eventProperties
  const isEnabled =
    +eventProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP <= +event.timestamp

  const applicationSideEffects =
    sideEffects != null && sideEffects.constructor === Object ? sideEffects : {}

  await handlers[eventType](
    {
      sideEffects: {
        ...wrapSideEffects(
          eventProperties,
          {
            ...applicationSideEffects,
            executeCommand: sagaProvider.executeCommand,
            executeQuery: sagaProvider.executeQuery,
            scheduleCommand
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
