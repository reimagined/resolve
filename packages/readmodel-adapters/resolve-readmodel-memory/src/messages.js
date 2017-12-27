/* eslint-disable max-len */

export default {
    searchExpressionOnlyObject: 'Search expression should be object with fields and search values',
    searchExpressionValuesOnlyPrimitive:
        'Search expression values should be either number or string and should not contain query operator',
    updateExpressionOnlyObject: 'Update expression should be object with fields and replace values',
    updateOperatorFixedSet: wrongOperator => `Update operator ${wrongOperator} is not permitted`,
    indexDescriptorReadShape:
        'Index descriptor should be object with only one name key and 1/-1 sort value',
    indexDescriptorWriteShape:
        'Index descriptor should be object with fields fieldName, fieldType (number or string) and optional order',

    deleteIndexArgumentShape: 'Delete index operation accepts only string value',
    modifyOperationForbiddenPattern: (operation, patterns) =>
        `Operation ${operation} contains forbidden patterns: ${patterns.join(', ')}`,
    mofidyOperationOnlyIndexedFiels: (operation, fieldName) =>
        `Operation ${operation} cannot be performed on non-indexed field ${fieldName} in search pattern`,
    mofidyOperationNoOptions: operation =>
        `Additional options in modify operation ${operation} are prohibited`,
    findOperationNoReuse:
        'After documents are retrieved with a search request, this search request cannot be reused',
    searchOnlyIndexedFields: 'Search on non-indexed fields is forbidden',
    sortOnlyIndexedFields: 'Sort by non-indexed fields is forbidden',
    sortOnlyAfterFind: 'Sorting can be specified only after find immediately',
    dublicateOperation: operation => `Search operation ${operation} is already in find chain`,
    readSideForbiddenOperation: (operation, collectionName) =>
        `The ${collectionName} collection’s ${operation} operation is not allowed on the read side`,
    unexistingCollection: collectionName => `Collection ${collectionName} does not exist`,
    reinitialization: 'The read model storage is already initialized'
};

/* eslint-enable max-len */
