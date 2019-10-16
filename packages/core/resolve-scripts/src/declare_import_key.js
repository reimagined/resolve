const importKeySymbol = Symbol('@@resolve/import_key')

export const declareImportKey = importKey => {
  if (importKey == null || importKey.constructor !== String) {
    throw new Error('Import key should be an string')
  }

  // eslint-disable-next-line no-new-wrappers
  const importKeyContainer = new String(importKey)
  importKeyContainer.type = importKeySymbol

  return importKeyContainer
}

export const checkImportKey = value =>
  !(value == null || value.type !== importKeySymbol)
