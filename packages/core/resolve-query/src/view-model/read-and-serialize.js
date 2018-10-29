const readAndSerialize = async (
  repository,
  { aggregateIds, jwtToken } = {}
) => {
  const state = await repository.read(repository, { aggregateIds })
  const serializedState = repository.serializeState(state, jwtToken)
  return serializedState
}

export default readAndSerialize
