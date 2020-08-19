export default async (resolve, { eventTypes, aggregateIds }, { viewModel }) => {
  const { data, cursor } = await resolve.buildViewModel(viewModel.name, {
    eventTypes,
    aggregateIds
  })

  return {
    data,
    meta: {
      cursor,
      eventTypes,
      aggregateIds
    }
  }
}
