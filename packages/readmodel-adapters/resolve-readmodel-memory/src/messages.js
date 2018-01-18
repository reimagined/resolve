/* eslint-disable max-len */

export default {
    storageRecreation: (storageType, storageName) =>
        `The ${storageName} is already created as ${storageType}`,
    wrongStorageType: (storageName, currentType, expectedType) =>
        `The ${storageName} is ${currentType}, but trying to operate like ${expectedType}`,
    readSideForbiddenOperation: (storageType, operation, storageName) =>
        storageType
            ? `The ${storageName} ${storageType}'s ${operation} operation is not allowed on the read side`
            : `The ${storageName} storage's ${operation} operation is not allowed on the read side`,
    unexistingStorage: (storageType, storageName) =>
        storageType
            ? `${storageType} ${storageName} does not exist`
            : `Storage ${storageName} does not exist`,
    reinitialization: 'The read model storage is already initialized'
};

/* eslint-enable max-len */
