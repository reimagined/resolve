export default async (resolve, query, { viewModel }) => {
  const { data, cursor } = await resolve.buildViewModel(viewModel.name, query)

  return {
    data,
    meta: {
      cursor,
      eventTypes: viewModel.eventTypes,
      aggregateIds: query.aggregateIds,
    },
  }
}
