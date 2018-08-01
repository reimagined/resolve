const host = require('my-local-ip')()

export default ({ resolveConfig }) => {
  const exports = []

  exports.push(
    `export subscribeAdapter from '$resolve.subscribeAdapter'`,
    `export aggregateActions from '$resolve.aggregateActions'`,
    `export aggregates from '$resolve.aggregates'`,
    `export viewModels from '$resolve.viewModels'`,
    `export readModels from '$resolve.readModels'`,
    `export rootPath from '$resolve.rootPath'`,
    `export staticPath from '$resolve.staticPath'`,
    `export jwtCookie from '$resolve.jwtCookie'`,
    `export applicationName from '$resolve.applicationName'`,
    `export const origin = "http://${host}:${resolveConfig.port}"`
  )

  return {
    code: exports.join('\r\n')
  }
}
