const createEventStore = (resolve) => {
  const eventStore = new Proxy(
    {},
    {
      get(_, key) {
        if (key === 'SaveEvent') {
          return async ({ event }) =>
            await resolve.eventstoreAdapter.saveEvent(event)
        } else if (key === 'LoadEvents') {
          return async ({ ...filter }) =>
            await resolve.eventstoreAdapter.loadEvents(filter)
        } else {
          return resolve.eventstoreAdapter[
            key[0].toLowerCase() + key.slice(1)
          ].bind(resolve.eventstoreAdapter)
        }
      },
      set() {
        throw new Error(`Event store API is immutable`)
      },
    }
  )

  return eventStore
}

export default createEventStore
