import wrapSideEffects from './wrap-side-effects'

const sagaEventHandler = async (
  currentReadModel,
  handlers,
  sideEffects,
  eventType,
  scheduleCommand,
  store,
  event
) => {
  const eventProperties = currentReadModel.eventProperties
  await handlers[eventType](
    {
      sideEffects: {
        executeCommand: currentReadModel.executeCommand,
        executeQuery: currentReadModel.executeQuery,
        isEnabled:
          +eventProperties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP >=
          +event.timestamp,
        ...wrapSideEffects(eventProperties, sideEffects),
        scheduleCommand
      },
      store
    },
    event
  )
}

export default sagaEventHandler
