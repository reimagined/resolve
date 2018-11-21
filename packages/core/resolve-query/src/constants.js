export const modelTypes = {
  viewModel: '@@resolve/VIEW_MODEL',
  readModel: '@@resolve/READ_MODEL'
}

export const errors = {
  duplicateName: 'A read/view name is not unique',
  modelNotFound: 'A read/view model is not defined',
  missingAdapter: 'Read model adapter not found',
  disposed: 'A query is disposed'
}
