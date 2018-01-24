/* eslint-disable max-len */

export default {
  readSideForbiddenOperation: (operation, storageName) =>
    `The ${storageName} storage's ${operation} operation is not allowed on the read side`,
  reinitialization: 'The read model storage is already initialized'
}

/* eslint-enable max-len */
