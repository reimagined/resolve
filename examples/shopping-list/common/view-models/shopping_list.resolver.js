export default async (resolve, params, { viewModel }) => {
  return await resolve.buildViewModel(viewModel.name, params)
}
