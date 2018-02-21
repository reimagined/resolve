/* eslint-disable max-len */

export default {
  readSideForbiddenOperation: operation =>
    `'${operation}' operation is not allowed on the read side`,
  alreadyInitialized: 'The read model storage is already initialized',
  storageExists: storageName => 'TODO: storageExists',
  storageNotExist: storageName => 'TODO: storageNotExist',
  invalidStorageSchema: 'TODO: invalidStorageSchema',
  fieldListNotArray: 'TODO: fieldListNotArray',
  invalidProjectionKey: key => 'TODO: invalidProjectionKey',
  invalidFieldName: name => 'TODO: invalidFieldName',
  invalidPagination: (skip, limit) => 'TODO: invalidPagination',
  invalidSearchExpression: expr => 'TODO: invalidSearchExpression',
  invalidUpdateExpression: expr => 'TODO: invalidUpdateExpression',
  invalidDocumentShape: doc => 'TODO: invalidDocumentShape'
}

/* eslint-enable max-len */
