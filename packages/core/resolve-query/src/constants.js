export const modelTypes = {
  viewModel: '@@resolve/VIEW_MODEL',
  readModel: '@@resolve/READ_MODEL'
}

export const errors = {
  duplicateName: 'A read/view name is not unique',
  modelNotFound: 'A read/view model is not defined',
  wrongAdapter: 'Read model adapter not found or present in multi instances',
  disposed: 'A query is disposed'
}
