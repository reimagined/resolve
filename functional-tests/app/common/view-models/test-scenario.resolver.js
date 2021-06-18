import { HttpError } from '@resolve-js/client'

const resolver = async (resolve, query, { viewModel }) => {
  const { data, cursor } = await resolve.buildViewModel(viewModel.name, query)

  if (data == null || data.blocked) {
    throw new HttpError(500, 'Test scenario test error to ignore on client')
  }

  return {
    data,
    meta: {
      cursor,
      eventTypes: viewModel.eventTypes,
      aggregateIds: query.aggregateIds,
    },
  }
}

export default resolver
