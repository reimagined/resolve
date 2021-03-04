import path from 'path'

const normalizeEntry = ([inputFile, { outputFile, moduleType, target }]) => ({
  inputFile,
  outputFile,
  moduleType,
  target,
})

const getClientEntries = ({ clientEntries }, isClient) => {
  const iifeEntries = clientEntries
    .filter((entry) => !Array.isArray(entry) || entry[1].moduleType === 'iife')
    .map((entry) =>
      !Array.isArray(entry)
        ? [
            entry,
            {
              outputFile: `client/${path.basename(entry)}`,
              moduleType: 'iife',
              target: 'web',
            },
          ]
        : entry
    )
    .map(normalizeEntry)
    .filter(({ target }) => (target === 'web') === isClient)

  const commonjsEntries = clientEntries
    .filter(
      (entry) => Array.isArray(entry) && entry[1].moduleType === 'commonjs'
    )
    .map(normalizeEntry)
    .filter(({ target }) => (target === 'web') === isClient)

  const esmEntries = clientEntries
    .filter((entry) => Array.isArray(entry) && entry[1].moduleType === 'esm')
    .map(normalizeEntry)
    .filter(({ target }) => (target === 'web') === isClient)

  return {
    iifeEntries,
    commonjsEntries,
    esmEntries,
  }
}

export default getClientEntries
