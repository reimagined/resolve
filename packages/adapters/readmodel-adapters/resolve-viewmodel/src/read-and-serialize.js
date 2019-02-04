const readAndSerialize = async (pool, { aggregateIds, jwtToken } = {}) => {
  const state = await pool.read(pool, { aggregateIds })
  const serializedState = await pool.serializeState(state, jwtToken)
  return serializedState
}

export default readAndSerialize
