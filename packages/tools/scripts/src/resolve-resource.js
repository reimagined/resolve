import fs from 'fs'
import path from 'path'
import getMonorepoNodeModules from './get_monorepo_node_modules'

export const isPackageImport = (specifier) =>
  specifier != null &&
  typeof specifier !== 'string' &&
  specifier.package != null &&
  specifier.import != null

export const resolveResource = (
  query,
  { instanceFallback, returnResolved } = {}
) => {
  const isPackage = isPackageImport(query)
  const moduleOrFile = isPackage ? query.package : query

  try {
    const customFilePath = path.resolve(process.cwd(), moduleOrFile)

    if (fs.existsSync(customFilePath)) {
      return {
        isPackage,
        result: customFilePath,
        imported: null,
      }
    }
  } catch (e) {}

  try {
    const resolvedQuery = require.resolve(moduleOrFile, {
      paths: [
        path.resolve(process.cwd(), 'node_modules'),
        path.resolve(__dirname, '../node_modules'),
        ...getMonorepoNodeModules(),
      ],
    })

    return {
      isPackage,
      result: returnResolved ? resolvedQuery : moduleOrFile,
      imported: isPackage ? query.import : null,
    }
  } catch (e) {}

  if (instanceFallback) {
    return resolveResource(instanceFallback)
  }

  throw new Error(`File "${query}" does not exist`)
}
