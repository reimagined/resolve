import { message } from '../constants'

export default ({ resolveConfig }) => {
  if (!resolveConfig.routes) {
    throw new Error(`${message.configNotContainSectionError}.routes`)
  }

  const exports = []

  exports.push(
    `import routes from ${JSON.stringify(resolveConfig.routes)}`,
    ``,
    `export default routes`
  )

  return {
    code: exports.join('\r\n')
  }
}
