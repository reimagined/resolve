const updateByEvents = async (readModel, events) => {
  if (!Array.isArray(events)) {
    throw new Error('Updating by events should supply events array')
  }
  if (readModel.disposePromise) {
    throw new Error('Read model is disposed')
  }
  if (readModel.projection == null) {
    throw new Error(
      'Updating by events is prohibited when projection is not specified'
    )
  }

  for (const event of events) {
    if (readModel.eventTypes.includes(event.type)) {
      await readModel.projection[event.type](readModel.writeStoreApi, event)
    }
  }
}

export default updateByEvents
