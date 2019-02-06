const read = async (pool, args) => {
  return `Invoke example custom read-model ${JSON.stringify({
    latestEvent: await pool.eventStore.getLatestEvent({}),
    busEvents: pool.events,
    readArguments: args
  })}`
}

export default read
