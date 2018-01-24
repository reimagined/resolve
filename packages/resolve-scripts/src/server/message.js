export default {
  readModelsArrayFormat: 'The readModels field should be an array',
  viewModelsArrayFormat: 'The viewModels field should be an array',
  readModelMandatoryName: 'A read model name is required',
  viewModelMandatoryName: 'A view model name is required',
  dublicateName: 'A read/view name is not unique',
  readModelQuerySideMandatory:
    'The gqlSchema and gqlResolvers fields are required for a read model facade',
  viewModelSerializable:
    'The serializeState and deserializeState fields are required for a view model facade',
  commandSuccess: 'OK',
  commandFail: 'A command error: ',
  readModelFail: 'A read model query error: ',
  viewModelFail: 'A view model query error: ',
  viewModelOnlyOnDemand: 'The aggregateIds field is required',
  ssrError: 'An SSR error: '
}
