const read = async (pool, eventFilter) => {
  return await pool.consumer.loadEvents(eventFilter)
}

export default read
