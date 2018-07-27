const host = process.argv[3] || require('my-local-ip')()

export default () => {
  const exports = []

  exports.push(
    `export aggregates from '$resolve.aggregates'`,
    `export viewModels from '$resolve.viewModels'`,
    `export readModels from '$resolve.readModels'`,
    `export rootPath from '$resolve.rootPath'`,
    `export staticPath from '$resolve.staticPath'`,
    `export jwtCookie from '$resolve.jwtCookie'`,
    `export applicationName from '$resolve.applicationName'`,
    `export const host = ${JSON.stringify(host)}`
  )

  return {
    code: exports.join('\r\n')
  }
}

;``
