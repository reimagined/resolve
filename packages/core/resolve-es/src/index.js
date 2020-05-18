export default ({ eventstore, publishEvent }) =>
  Object.freeze({
    loadEvents: eventstore.loadEvents.bind(eventstore),
    import: eventstore.import.bind(eventstore),
    export: eventstore.export.bind(eventstore),
    getLatestEvent: eventstore.getLatestEvent.bind(eventstore),
    getNextCursor: eventstore.getNextCursor.bind(eventstore),
    saveEvent: async event => {
      await eventstore.saveEvent(event)
      if (typeof publishEvent === 'function') {
        await publishEvent(event)
      }
      return event
    },
    dispose: Promise.resolve.bind(Promise),
    getSecretsManager: eventstore.getSecretsManager.bind(eventstore)
  })
