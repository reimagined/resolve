const resolver = async function runResolver(api, query, { viewModel }) {
  const [targetId] = query.aggregateIds
  const { name, eventTypes } = viewModel
  const aggregateIds = [`${targetId}-target`]

  const { data, cursor } = await api.buildViewModel(name, { aggregateIds })

  return {
    data,
    meta: { cursor, eventTypes, aggregateIds },
  }
}

export default resolver
