export default ({ storage, publishEvent }) =>
  Object.freeze({
    loadEvents: storage.loadEvents.bind(storage),
    import: storage.import.bind(storage),
    export: storage.export.bind(storage),
    getLatestEvent: storage.getLatestEvent.bind(storage),
    getNextCursor: storage.getNextCursor.bind(storage),
    saveEvent: async event => {
      await storage.saveEvent(event)
      if (typeof publishEvent === 'function') {
        await publishEvent(event)
      }
      return event
    },
    dispose: Promise.resolve.bind(Promise),
    getSecretsManager: storage.getSecretsManager.bind(storage)
  })
