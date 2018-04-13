/* eslint-disable max-len */

export default {
  invalidApiImplementation: 'Invalid read-model adapter API implementation',
  readSideForbiddenOperation: operation =>
    `'${operation}' operation is not allowed on the read side`,
  alreadyInitialized: 'The read model table is already initialized',
  tableExists: tableName => `Table ${tableName} already exists`,
  tableNotExist: tableName => `Table ${tableName} does not exist`,
  invalidTableSchema: 'Provided table schema is invalid',
  invalidFieldList: 'Provided fields list is invalid',
  invalidProjectionKey: key => `Projection fields key ${key} is invalid`,
  invalidFieldName: name => `Field name ${name} is invalid`,
  invalidPagination: (skip, limit) =>
    `Pagination range skip=${skip} and limit=${limit} is invalid`,
  invalidSearchExpression: expr =>
    `Search expression ${JSON.stringify(expr)} is invalid`,
  invalidUpdateExpression: expr =>
    `Update expression ${JSON.stringify(expr)} is invalid`,
  invalidDocumentShape: doc =>
    `Document ${JSON.stringify(doc)} has invalid shape`
}

/* eslint-enable max-len */
