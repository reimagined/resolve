export default () => {
  const exports = []

  exports.push(
    `export { default as aggregates } from '$resolve.aggregates'`,
    `export { default as aggregateActions } from '$resolve.aggregateActions'`,
    `export { default as viewModels } from '$resolve.viewModels'`,
    `export { default as readModels } from '$resolve.readModels'`,
    `export { default as rootPath } from '$resolve.rootPath'`,
    `export { default as staticPath } from '$resolve.staticPath'`,
    `export { default as jwtCookie } from '$resolve.jwtCookie'`,
    `export { default as applicationName } from '$resolve.applicationName'`,
    `export { default as subscribeAdapter } from '$resolve.subscribeAdapter'`,
    `export { default as customConstants } from '$resolve.customConstants'`
  )

  return {
    code: exports.join('\r\n')
  }
}
