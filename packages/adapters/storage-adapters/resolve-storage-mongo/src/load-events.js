const loadEvents = async (pool, criteria, values, callback, startTime) => {
  const cursorStream = pool.collection
    .find({ [criteria]: { $in: values }, timestamp: { $gt: startTime } })
    .sort({ timestamp: 1, aggregateVersion: 1 })
    .project({ _id: 0 })
    .stream()

  for (
    let event = await cursorStream.next();
    event != null;
    event = await cursorStream.next()
  ) {
    await callback(event)
  }

  await cursorStream.close()
}

export default loadEvents
