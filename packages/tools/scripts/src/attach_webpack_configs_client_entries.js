import path from 'path'

import getClientEntries from './get_client_entries'

const attachWebpackConfigsClientEntries = (
  resolveConfig,
  baseConfig,
  configs,
  isClient
) => {
  const { iifeEntries, commonjsEntries, esmEntries } = getClientEntries(
    resolveConfig,
    isClient
  )

  if (iifeEntries.length > 0) {
    configs.push({
      ...baseConfig,
      name: `${isClient ? 'Client' : 'Server'} IIFE entries`,
      entry: iifeEntries.reduce((acc, { inputFile, outputFile }) => {
        acc[outputFile] = `${path.resolve(
          __dirname,
          './alias/$resolve.clientEntry.js'
        )}?inputFile=${inputFile}`
        return acc
      }, {}),
    })
  }

  if (commonjsEntries.length > 0) {
    configs.push({
      ...baseConfig,
      name: `${isClient ? 'Client' : 'Server'} CommonJS entries`,
      entry: commonjsEntries.reduce((acc, { inputFile, outputFile }) => {
        acc[outputFile] = `${path.resolve(
          __dirname,
          './alias/$resolve.clientEntry.js'
        )}?inputFile=${inputFile}`
        return acc
      }, {}),
      output: {
        ...baseConfig.output,
        libraryTarget: 'commonjs-module',
      },
    })
  }

  if (esmEntries.length > 0) {
    configs.push({
      ...baseConfig,
      name: `${isClient ? 'Client' : 'Server'} Client ESM entries`,
      entry: esmEntries.reduce((acc, { inputFile, outputFile }) => {
        acc[outputFile] = `${path.resolve(
          __dirname,
          './alias/$resolve.clientEntry.js'
        )}?inputFile=${inputFile}`
        return acc
      }, {}),
      output: {
        ...baseConfig.output,
        libraryTarget: 'var',
        library: '__RESOLVE_ENTRY__',
      },
      plugins: [...baseConfig.plugins],
    })
  }
}

export default attachWebpackConfigsClientEntries
