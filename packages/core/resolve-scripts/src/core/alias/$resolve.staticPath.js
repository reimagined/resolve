import { message } from '../constants'

export default ({ resolveConfig }) => {
  if (resolveConfig.staticPath == null || resolveConfig.staticPath === '') {
    throw new Error(`${message.configNotContainSectionError}.staticPath`)
  }

  const exports = []

  exports.push(
    `const staticPath = ${JSON.stringify(resolveConfig.staticPath, null, 2)}`,
    ``,
    `export default staticPath`
  )

  return {
    code: exports.join('\r\n')
  }
}
