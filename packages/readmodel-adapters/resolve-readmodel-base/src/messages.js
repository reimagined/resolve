/* eslint-disable max-len */

export default {
  readSideForbiddenOperation: operation =>
    `'${operation}' operation is not allowed on the read side`,
  alreadyInitialized: 'The read model storage is already initialized',
  storageExists: storageName => `Storage ${storageName} already exists`,
  storageNotExist: storageName => `Storage ${storageName} does not exist`,
  invalidStorageSchema: 'Provided storage schema is invalid',
  invalidFieldList: 'Provided fields list is invalid',
  invalidProjectionKey: key => `Projection fields key ${key} is invalid`,
  invalidFieldName: name => `Field name ${name} is invalid`,
  invalidPagination: (skip, limit) => `Pagination range skip=${skip} and limit=${limit} is invalid`,
  invalidSearchExpression: expr => `Search expression ${expr} is invalid`,
  invalidUpdateExpression: expr => `Update expression ${expr} is invalid`,
  invalidDocumentShape: doc => `Document ${doc} has invalid shape`
}

/* eslint-enable max-len */
