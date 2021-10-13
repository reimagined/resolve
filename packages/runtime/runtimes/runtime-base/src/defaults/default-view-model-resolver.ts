import { ViewModelQuery } from '@resolve-js/core'

// TODO: what type of another "resolve" and viewModel used here?
export const defaultViewModelResolver = async (
  resolve: any,
  query: ViewModelQuery,
  {
    viewModel,
  }: {
    viewModel: any
  }
) => {
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
