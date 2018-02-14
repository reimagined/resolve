/* eslint-disable max-len */

export default {
  readSideForbiddenOperation: operation =>
    `'${operation}' operation is not allowed on the read side`,
  alreadyInitialized: 'The read model storage is already initialized',
  storageExists: storageName => 'TODO: ...',
  storageNotExist: storageName => 'TODO: ...',
  fieldListNotArray: 'TODO: ...',
  invalidProjectionKey: key => 'TODO: ...',
  invalidFieldName: name => 'TODO: ...',
  invalidPagination: (skip, limit) => 'TODO: ...',
  invalidSearchExpression: expr => 'TODO: ...',
  invalidUpdateExpression: expr => 'TODO: ...',
  invalidDocumentShape: doc => 'TODO: ...'
}

/* eslint-enable max-len */
