import { message } from '../constants'

export default ({ resolveConfig }) => {
  if (resolveConfig.rootPath === undefined) {
    throw new Error(`${message.configNotContainSectionError}.rootPath`)
  }

  const exports = []

  exports.push(
    `const rootPath = ${JSON.stringify(resolveConfig.rootPath)}`,
    ``,
    `export default rootPath`
  )

  return {
    code: exports.join('\r\n')
  }
}
