import path from 'path'
import { sync as glob } from 'glob'
import { loadPackageJson } from './utils'

export function getAvailableExamples(rootPath: string) {
  const sources = ['./examples/**/package.json', './templates/**/package.json']

  const packages = sources
    .map((source) =>
      glob(source, {
        cwd: rootPath,
        absolute: true,
        ignore: ['**/node_modules/**', './node_modules/**', '**/dist/**'],
      })
    )
    .flat(1)

  const resolveExamples = []
  for (const filePath of packages) {
    const { name, description, resolveJs } = loadPackageJson(filePath)

    if (!description || !resolveJs || !resolveJs.isAppTemplate) {
      continue
    }

    resolveExamples.push({
      name,
      description,
      path: path.dirname(path.relative(rootPath, filePath)),
    })
  }

  resolveExamples.sort((a, b) =>
    a.name > b.name ? 1 : a.name < b.name ? -1 : 0
  )

  return resolveExamples
}
