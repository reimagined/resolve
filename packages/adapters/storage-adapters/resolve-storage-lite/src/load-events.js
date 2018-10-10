const loadEvents = async (pool, criteria, values, callback, startTime) => {
  const cursor = pool.db
    .find({ [criteria]: { $in: values }, timestamp: { $gt: startTime } })
    .sort({ timestamp: 1, aggregateVersion: 1 })
    .projection({ aggregateIdAndVersion: 0, _id: 0 })

  const events = await pool.promiseInvoke(cursor.exec.bind(cursor))

  for (const event of events) {
    await callback(event)
  }
}

export default loadEvents
