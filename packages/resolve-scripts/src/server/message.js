export default {
    readModelsArrayFormat: 'The readModels field should be an array.',
    readModelMandatoryName: 'A read model name is required.',
    readModelQuerySideMandatory:
        'The gqlSchema and gqlResolvers fields are required for a read model. Otherwise, ' +
            'the viewModel field should be set to true to specify that this is a view model.',
    commandSuccess: 'OK',
    commandFail: 'A command error: ',
    readModelFail: 'A read model query error: ',
    viewModelFail: 'A view model query error: ',
    viewModelOnlyOnDemand: 'The "aggregateIds" and "eventTypes" fields are required',
    ssrError: 'An SSR error: '
};
