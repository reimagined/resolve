export default ({ storage, encryption, publishEvent }) => {
  let loadEvents
  let getLatestEvent // this method missed in resolve-storage-base
  let saveEvent

  if (encryption) {
    loadEvents = async () => {
      const rawEvents = await storage.loadEvents(storage)
      return rawEvents.map(event => {
        // return encryption.decrypt(event)
        return event
      })
    }
    getLatestEvent = async () => {
      const event = await storage.getLatestEvent(storage)
      //return encryption.decrypt(event)
      return event
    }
    saveEvent = async event => {
      const encryptedEvent = encryption.encrypt(event)
      await storage.saveEvent(encryptedEvent)
      if (typeof publishEvent === 'function') {
        await publishEvent(encryptedEvent) // publishing original event does not makes sense!
      }
      return encryptedEvent
    }
  } else {
    loadEvents = storage.loadEvents.bind(storage)
    getLatestEvent = storage.getLatestEvent.bind(storage)
    saveEvent = async event => {
      await storage.saveEvent(event)
      if (typeof publishEvent === 'function') {
        await publishEvent(event)
      }
      return event
    }
  }

  return Object.freeze({
    loadEvents,
    saveEvent,
    getLatestEvent,
    import: storage.import.bind(storage),
    export: storage.export.bind(storage),
    getNextCursor: storage.getNextCursor.bind(storage),
    dispose: Promise.resolve.bind(Promise)
  })
}
