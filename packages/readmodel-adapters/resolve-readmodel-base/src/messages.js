/* eslint-disable max-len */

export default {
  invalidApiImplementation: 'Invalid read-model adapter API implementation',
  readSideForbiddenOperation: operation =>
    `'${operation}' operation is not allowed on the read side`,
  alreadyInitialized: 'The read model storage is already initialized',
  storageExists: storageName => `Storage ${storageName} already exists`,
  storageNotExist: storageName => `Storage ${storageName} does not exist`,
  invalidStorageSchema: 'Provided storage schema is invalid',
  invalidFieldList: 'Provided fields list is invalid',
  invalidProjectionKey: key => `Projection fields key ${key} is invalid`,
  invalidFieldName: name => `Field name ${name} is invalid`,
  invalidPagination: (skip, limit) =>
    `Pagination range skip=${skip} and limit=${limit} is invalid`,
  invalidUpdateExpression: expr =>
    `Update expression ${JSON.stringify(expr)} is invalid`,
  invalidDocumentShape: doc =>
    `Document ${JSON.stringify(doc)} has invalid shape`
}

/* eslint-enable max-len */
