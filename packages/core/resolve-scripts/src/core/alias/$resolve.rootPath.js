import { message } from '../constants'

export default ({ resolveConfig }) => {
  if (resolveConfig.rootPath === undefined) {
    throw new Error(`${message.configNotContainSectionError}.rootPath`)
  }

  const rootPath = resolveConfig.rootPath

  const exports = []

  exports.push(
    `const rootPath = ${JSON.stringify(rootPath)}`,
    ``,
    `export default rootPath`
  )

  return {
    code: exports.join('\r\n')
  }
}
