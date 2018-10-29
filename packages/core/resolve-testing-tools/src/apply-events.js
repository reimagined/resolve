const applyEvents = async (pool, events) => {
  const result = []
  for (const event of events) {
    result.push(await pool.applyEvent(pool, event))
  }
  return result
}

export default applyEvents
